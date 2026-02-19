import Link from "next/link";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getServiceSupabase } from "@/lib/supabase/service";
import { getPublicEnv } from "@/lib/env";
import { fetchAuthedContext } from "@/lib/app/session";
import type { Database } from "@/types/database";

const GLOBAL_CONFIG_ID = "00000000-0000-0000-0000-000000000001";

export const metadata = {
  title: "LINE特典 | 来世ガチャ",
};

type LineLinkState = {
  rewarded_at: string | null;
  created_at: string;
};

type LinePageProps = {
  searchParams?: Promise<{ status?: string; points?: string }>;
};

async function fetchLineRewardPoints(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from("gacha_global_config")
    .select("line_reward_points")
    .eq("id", GLOBAL_CONFIG_ID)
    .maybeSingle();
  if (error) {
    console.error("Failed to load line reward points", error);
    return 50;
  }
  return typeof data?.line_reward_points === "number" ? data.line_reward_points : 50;
}

async function fetchLatestLineLinkState(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client
    .from("line_link_states")
    .select("rewarded_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== "PGRST116") {
    console.error("Failed to load line link state", error);
    return null;
  }
  return (data as LineLinkState | null) ?? null;
}

const statusMessages: Record<string, (points?: number) => { tone: "success" | "error"; text: string }> = {
  success: (points) => ({ tone: "success", text: `LINE連携が完了し、${points ?? 0} Nポイントを付与しました。` }),
  "already-linked": () => ({ tone: "success", text: "すでにLINE連携が完了しています。" }),
  "line-user-already-linked": () => ({ tone: "error", text: "このLINEアカウントは他のユーザーと連携済みです。" }),
  "line-login-error": () => ({ tone: "error", text: "LINE連携中にエラーが発生しました。時間をおいて再度お試しください。" }),
  "line-login-denied": () => ({ tone: "error", text: "LINEでの承認がキャンセルされました。再度連携を行ってください。" }),
  "line-login-disabled": () => ({ tone: "error", text: "現在LINE連携は準備中です。設定完了までお待ちください。" }),
};

function resolveStatusMessage(status?: string, points?: number) {
  if (!status) return null;
  const factory = statusMessages[status];
  if (!factory) return null;
  return factory(points);
}

export default async function LinePerkPage({ searchParams }: LinePageProps) {
  const params = await searchParams;
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase);
  if (!context) {
    redirect("/login");
  }

  const userId = context.user.id;
  const [lineRewardPoints, linkState] = await Promise.all([
    fetchLineRewardPoints(supabase),
    fetchLatestLineLinkState(supabase, userId),
  ]);

  const lineUrl = getPublicEnv().NEXT_PUBLIC_LINE_OFFICIAL_URL ?? "https://lin.ee/raisegacha";
  const linkedAt = linkState?.rewarded_at ? new Date(linkState.rewarded_at).toLocaleString("ja-JP") : null;
  const lineLoginEnabled = Boolean(process.env.LINE_LOGIN_CHANNEL_ID);
  const isLinked = Boolean(linkState?.rewarded_at);
  const pointsFromQuery = params?.points ? Number(params.points) : undefined;
  const resolvedPoints =
    typeof pointsFromQuery === "number" && Number.isFinite(pointsFromQuery) ? pointsFromQuery : lineRewardPoints;
  const message = resolveStatusMessage(params?.status, resolvedPoints);

  return (
    <section className="space-y-8 pb-12">
      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            message.tone === "success"
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/40 bg-red-400/10 text-red-100"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">LINE BONUS</p>
        <h1 className="font-display text-4xl text-white">公式LINE特典</h1>
        <p className="text-sm text-white/70">
          来世ガチャ公式LINEに連携すると、設定されたNポイントが即時に付与されます。
        </p>
        <p className="text-xs text-white/50">付与ポイント数やキャンペーン内容は運営によって変更される場合があります。</p>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">現在の付与ポイント</p>
            <p className="mt-2 text-sm text-white/70">LINE連携すると即時に受け取れるNポイント</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/30 bg-emerald-400/10 px-6 py-3 text-center">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-emerald-200">Bonus</p>
            <p className="text-4xl font-display text-emerald-200">{lineRewardPoints.toLocaleString("ja-JP")}</p>
            <p className="text-xs text-emerald-100/80">Nポイント</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {isLinked ? (
            <span className="flex-1 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm font-semibold text-emerald-100">
              LINE連携済み
            </span>
          ) : lineLoginEnabled ? (
            <a
              href="/api/line/login/start"
              className="flex-1 rounded-2xl border border-white/15 bg-gradient-to-r from-[#06c755] to-[#00a64f] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_20px_45px_rgba(0,0,0,0.35)] transition hover:scale-[1.01]"
            >
              LINE連携を開始
            </a>
          ) : (
            <span className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/40">
              LINE連携は準備中です
            </span>
          )}
          <a
            href={lineUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            公式LINEを開く
          </a>
          <Link
            href="/mypage"
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            メニューに戻る
          </Link>
        </div>
        {linkedAt && (
          <p className="text-center text-xs text-emerald-200">最終連携日時: {linkedAt}</p>
        )}
        <p className="text-xs text-white/60">
          * Nポイントは来世ガチャ内でチケット交換やキャンペーン応募に使用できます。獲得状況は「マイページ &gt; チケット / 特典」から確認してください。
        </p>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2dd4bf] text-lg font-bold text-black">
            1
          </div>
          <h2 className="font-display text-2xl text-white">獲得ステップ</h2>
        </div>
        <ol className="space-y-4 text-sm text-white/80">
          <li className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="font-semibold text-white">① 「LINE連携を開始」ボタンを押す</p>
            <p className="text-white/70">ボタンを押すとLINEアプリ（またはブラウザ）が開き、連携用の画面が表示されます。</p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="font-semibold text-white">② LINEで承認</p>
            <p className="text-white/70">LINEが表示する確認内容を承認すると、自動的に友だち追加と連携が完了します。</p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="font-semibold text-white">③ 即時でNポイント付与</p>
            <p className="text-white/70">承認後すぐにNポイントが残高へ追加され、お知らせにも通知が届きます。</p>
          </li>
        </ol>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-yellow text-lg font-bold text-black">
            Q
          </div>
          <h2 className="font-display text-2xl text-white">よくある質問</h2>
        </div>
        <div className="space-y-3 text-sm text-white/80">
          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="font-semibold text-white">ポイントはいつ反映されますか？</p>
            <p className="text-white/70">LINEで承認するとすぐに残高へ反映されます。画面をリロードすると更新後の値を確認できます。</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="font-semibold text-white">過去に一度追加したことがあります。再度もらえますか？</p>
            <p className="text-white/70">原則1アカウントにつき1回のみ付与されます。再連携は可能ですが追加付与は行われません。</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="font-semibold text-white">付与ポイント数が変わることはありますか？</p>
            <p className="text-white/70">はい。イベントや在庫状況に合わせて運営が設定を変更できます。最新の値は常にこのページに表示されます。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
