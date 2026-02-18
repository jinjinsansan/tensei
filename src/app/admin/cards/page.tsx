import { revalidatePath } from "next/cache";

import { AdminCard, AdminPageHero, AdminSectionTitle } from "@/components/admin/admin-ui";
import { fetchAllCards, fetchAllCharacters } from "@/lib/data/gacha";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { TablesInsert, TablesUpdate } from "@/types/database";

function parseOptionalInteger(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("最大供給数は0以上の数値で入力してください");
  }
  return Math.floor(parsed);
}

async function addCard(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const isLossCard = formData.get("isLossCard") === "on";
  const maxSupply = parseOptionalInteger(formData.get("maxSupply"));
  const payload: TablesInsert<"cards"> = {
    card_name: String(formData.get("name")),
    character_id: String(formData.get("character")),
    star_level: Number(formData.get("star")),
    rarity: (formData.get("rarity") as TablesInsert<"cards">["rarity"]) ?? "N",
    card_image_url: (formData.get("image") as string) || "/placeholders/card-default.svg",
    description: (formData.get("description") as string) || null,
    has_reversal: formData.get("hasReversal") === "on",
    sort_order: Number(formData.get("sortOrder") ?? 0),
    is_active: true,
    is_loss_card: isLossCard,
    max_supply: isLossCard ? null : maxSupply,
  };
  await supabase.from("cards").insert(payload);
  revalidatePath("/admin/cards");
}

async function updateCardSupply(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const cardId = String(formData.get("cardId") ?? "");
  if (!cardId) {
    throw new Error("カードIDが不明です");
  }
  const intent = (formData.get("intent") as string) ?? "update";
  const { data: card, error } = await supabase
    .from("cards")
    .select("id, is_loss_card, current_supply")
    .eq("id", cardId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!card) {
    throw new Error("カードが見つかりません");
  }

  if (card.is_loss_card) {
    revalidatePath("/admin/cards");
    return;
  }

  const nextMaxSupply = intent === "clear" ? null : parseOptionalInteger(formData.get("maxSupply"));
  if (nextMaxSupply !== null && card.current_supply != null && nextMaxSupply < card.current_supply) {
    throw new Error("現在の供給数より小さい上限には設定できません");
  }

  const updates: TablesUpdate<"cards"> = {
    max_supply: nextMaxSupply,
  };

  const { error: updateError } = await supabase.from("cards").update(updates).eq("id", cardId);
  if (updateError) {
    throw new Error(updateError.message);
  }
  revalidatePath("/admin/cards");
}

export default async function CardAdminPage() {
  const supabase = getServiceSupabase();
  const [cards, characters] = await Promise.all([
    fetchAllCards(supabase),
    fetchAllCharacters(supabase),
  ]);
  const characterMap = new Map(characters.map((char) => [char.id, char.name]));

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Cards"
        title="カード管理"
        description="カードセットの概要と新規カードの追加を行います。"
      />

      <AdminCard>
        <AdminSectionTitle title="カード一覧" description="供給上限とLOSSカードの状態を確認できます" />
        <div className="mt-6 space-y-4">
          {cards.map((card) => {
            const isLossCard = Boolean(card.is_loss_card);
            const maxSupply = card.max_supply ?? null;
            const currentSupply = card.current_supply ?? 0;
            const remaining = maxSupply != null ? Math.max(0, maxSupply - currentSupply) : null;
            const progress = maxSupply && maxSupply > 0 ? Math.min(1, currentSupply / maxSupply) : 0;
            const progressPercent = `${Math.min(100, Math.max(0, progress * 100)).toFixed(1)}%`;
            const characterName = characterMap.get(card.character_id) ?? "Unknown";
            return (
              <div
                key={card.id}
                className="rounded-3xl border border-white/12 bg-white/[0.03] p-5 shadow-panel-inset"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{card.rarity}</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{card.card_name}</h2>
                    <p className="text-sm text-white/70">★{card.star_level}</p>
                    <p className="text-xs text-white/60">キャラクター: {characterName}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70">
                    {isLossCard && (
                      <span className="rounded-full border border-red-400/40 px-3 py-1 text-red-200">LOSS</span>
                    )}
                    {maxSupply == null && !isLossCard && (
                      <span className="rounded-full border border-white/20 px-3 py-1">無制限</span>
                    )}
                  </div>
                </div>
                {card.description && (
                  <p className="mt-3 text-sm text-white/70 line-clamp-2">{card.description}</p>
                )}
                <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">供給状況</p>
                      <div className="mt-1 flex flex-wrap items-end gap-3">
                        <p className="text-2xl font-mono text-white">
                          {isLossCard
                            ? "LOSS / 無制限"
                            : maxSupply != null
                              ? `${currentSupply.toLocaleString()} / ${maxSupply.toLocaleString()}`
                              : `${currentSupply.toLocaleString()} / ∞`}
                        </p>
                        {!isLossCard && maxSupply != null && (
                          <span className="text-xs text-white/60">残り {remaining?.toLocaleString()} 枚</span>
                        )}
                      </div>
                    </div>
                    {!isLossCard && maxSupply != null && (
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#7bf1ff] via-[#c084fc] to-[#ff8bd5]"
                            style={{ width: progressPercent }}
                          />
                        </div>
                        <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">
                          {progressPercent} 消化
                        </p>
                      </div>
                    )}
                    {isLossCard && (
                      <p className="text-xs text-red-200">
                        LOSSカードは常に無制限で、供給上限は設定できません。
                      </p>
                    )}
                  </div>
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">上限を更新</p>
                    <form action={updateCardSupply} className="space-y-3">
                      <input type="hidden" name="cardId" value={card.id} />
                      <label className="text-xs text-white/70">
                        最大供給数
                        <input
                          type="number"
                          name="maxSupply"
                          min={0}
                          placeholder="空欄で無制限"
                          defaultValue={card.max_supply ?? ""}
                          disabled={isLossCard}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none disabled:opacity-40"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          name="intent"
                          value="update"
                          disabled={isLossCard}
                          className="flex-1 rounded-2xl bg-gradient-to-r from-[#7bf1ff] to-[#c084fc] px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          更新
                        </button>
                        <button
                          type="submit"
                          name="intent"
                          value="clear"
                          disabled={isLossCard || card.max_supply === null}
                          className="flex-1 rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          無制限に戻す
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard>
        <AdminSectionTitle title="カード追加" description="フォームを埋めてカードを登録します" />
        <form action={addCard} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            カード名
            <input name="name" required className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            キャラクター
            <select
              name="character"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/60"
            >
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            星
            <input type="number" name="star" min={1} max={12} defaultValue={1} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            レアリティ
            <select
              name="rarity"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/60"
            >
              {['N','R','SR','SSR','UR','LR'].map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            画像URL
            <input name="image" placeholder="/placeholders/card-default.svg" className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            並び順
            <input type="number" name="sortOrder" defaultValue={0} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            最大供給数
            <input
              type="number"
              name="maxSupply"
              min={0}
              placeholder="空欄で無制限"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
            />
          </label>
          <label className="text-sm md:col-span-2">
            説明
            <textarea name="description" rows={3} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hasReversal" className="h-4 w-4 rounded border-white/30 bg-transparent" /> どんでん返し動画あり
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isLossCard" className="h-4 w-4 rounded border-white/30 bg-transparent" /> LOSSカード（上限なし）
          </label>
          <div className="md:col-span-2">
            <button className="w-full rounded-2xl bg-gradient-to-r from-[#ffd86f] to-[#ff8bd5] px-4 py-3 font-semibold text-slate-950">
              追加する
            </button>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
