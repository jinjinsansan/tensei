import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getServiceSupabase } from '@/lib/supabase/service';
import type { Tables } from '@/types/database';

type GachaCharacterRow = Tables<'gacha_characters'>;
type GachaRtpRow = Tables<'gacha_rtp_config'>;

const BUILTIN_CHARACTERS: { id: string; name: string }[] = [
  { id: 'kenta', name: '健太' },
  { id: 'shoichi', name: '昭一' },
];

async function updateCharacterConfig(formData: FormData) {
  'use server';
  const characterId = String(formData.get('characterId') ?? '');
  if (!characterId) {
    console.error('[updateCharacterConfig] characterId is missing');
    return redirect('/admin/character-rtp?error=missing_character_id');
  }

  const supabase = getServiceSupabase();
  
  console.log('[updateCharacterConfig] Starting update for:', characterId);

  const characterName = String(formData.get('characterName') ?? characterId);
  const isActive = formData.get('isActive') === 'on';
  const weightRaw = Number(formData.get('weight') ?? 0);
  const weight = Number.isFinite(weightRaw) ? Math.max(0, weightRaw) : 0;

  // 最低1つのキャラクターを有効にする必要があるかチェック
  if (!isActive) {
    const { data: otherCharacters } = await supabase
      .from('gacha_characters')
      .select('is_active')
      .neq('character_id', characterId);

    const hasOtherActive = otherCharacters?.some((row) => row.is_active);
    if (!hasOtherActive) {
      console.error('[updateCharacterConfig] Cannot deactivate last character');
      return redirect('/admin/character-rtp?error=last_character');
    }
  }
  
  console.log('[updateCharacterConfig] Validation passed:', {
    isActive,
    weight,
    totalRtp: n + r + sr + ssr + ur + lr
  });

  const n = Number(formData.get('rarity_N') ?? 0);
  const r = Number(formData.get('rarity_R') ?? 0);
  const sr = Number(formData.get('rarity_SR') ?? 0);
  const ssr = Number(formData.get('rarity_SSR') ?? 0);
  const ur = Number(formData.get('rarity_UR') ?? 0);
  const lr = Number(formData.get('rarity_LR') ?? 0);
  const dondenRaw = Number(formData.get('dondenRate') ?? 0);
  const dondenRate = Number.isFinite(dondenRaw) ? Math.min(Math.max(dondenRaw, 0), 100) : 0;

   const totalRtp = n + r + sr + ssr + ur + lr;
   if (Number.isFinite(totalRtp) && Math.abs(totalRtp - 100) > 0.1) {
     console.error('[updateCharacterConfig] RTP validation failed:', { totalRtp });
     return redirect(`/admin/character-rtp?error=rtp_total&total=${totalRtp.toFixed(1)}`);
   }

  const { error: characterError } = await supabase
    .from('gacha_characters')
    .upsert(
      {
        character_id: characterId,
        character_name: characterName,
        is_active: isActive,
        weight,
      },
      { onConflict: 'character_id' },
    );
    
  if (characterError) {
    console.error('[updateCharacterConfig] gacha_characters upsert failed:', characterError);
    return redirect(`/admin/character-rtp?error=db_character&msg=${encodeURIComponent(characterError.message)}`);
  }

  const { error: rtpError } = await supabase
    .from('gacha_rtp_config')
    .upsert(
      {
        character_id: characterId,
        rarity_n: n,
        rarity_r: r,
        rarity_sr: sr,
        rarity_ssr: ssr,
        rarity_ur: ur,
        rarity_lr: lr,
        donden_rate: dondenRate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'character_id' },
    );
    
  if (rtpError) {
    console.error('[updateCharacterConfig] gacha_rtp_config upsert failed:', rtpError);
    return redirect(`/admin/character-rtp?error=db_rtp&msg=${encodeURIComponent(rtpError.message)}`);
  }

  console.log('[updateCharacterConfig] Success!');
  revalidatePath('/admin/character-rtp');
  return redirect('/admin/character-rtp?success=true');
}

export default async function CharacterRtpPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string; total?: string; msg?: string }>;
}) {
  const params = await searchParams;
  const errorType = params?.error;
  const successFlag = params?.success;
  const totalRtp = params?.total;
  const errorMsg = params?.msg;

  const supabase = getServiceSupabase();
  const [{ data: gachaCharactersData }, { data: rtpData }] = await Promise.all([
    supabase.from('gacha_characters').select('*'),
    supabase.from('gacha_rtp_config').select('*'),
  ]);

  const gachaCharacters = (gachaCharactersData ?? []) as GachaCharacterRow[];
  const rtpRows = (rtpData ?? []) as GachaRtpRow[];
  
  console.log('[CharacterRtpPage] Current data:', {
    gachaCharacters: gachaCharacters.map((c) => ({
      id: c.character_id,
      name: c.character_name,
      isActive: c.is_active,
      weight: c.weight,
    })),
    rtpCount: rtpRows.length,
  });

  const rtpByCharacterId = new Map<string, GachaRtpRow>();
  for (const row of rtpRows) {
    rtpByCharacterId.set(row.character_id, row);
  }

  const byCharacterId = new Map<string, { character: GachaCharacterRow; rtp: GachaRtpRow | null }>();
  for (const row of gachaCharacters) {
    byCharacterId.set(row.character_id, { character: row, rtp: rtpByCharacterId.get(row.character_id) ?? null });
  }

  // 既存行に存在しないビルトインキャラはデフォルト行を追加
  for (const builtin of BUILTIN_CHARACTERS) {
    if (!byCharacterId.has(builtin.id)) {
      byCharacterId.set(builtin.id, {
        character: {
          id: '',
          character_id: builtin.id,
          character_name: builtin.name,
          is_active: builtin.id === 'kenta',
          weight: builtin.id === 'kenta' ? 60 : 40,
          created_at: null,
          updated_at: null,
        } as GachaCharacterRow,
        rtp: null,
      });
    }
  }

  const entries = Array.from(byCharacterId.entries());

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">RTP</p>
        <h1 className="text-2xl font-bold">キャラクター別RTP設定</h1>
        <p className="text-sm text-secondary">キャラクターの出現比率とレアリティごとの出目、どんでん返し率を調整します。</p>
      </header>

      {successFlag === 'true' && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-950/40 p-4">
          <p className="text-sm font-semibold text-emerald-300">✅ 保存しました</p>
        </div>
      )}

      {errorType && (
        <div className="rounded-2xl border border-red-400/40 bg-red-950/40 p-4">
          <p className="text-sm font-semibold text-red-300">❌ エラー</p>
          <p className="mt-1 text-xs text-red-200">
            {errorType === 'missing_character_id' && 'キャラクターIDが指定されていません。'}
            {errorType === 'last_character' && '最低1つのキャラクターを有効にする必要があります。'}
            {errorType === 'rtp_total' && `★別RTPの合計が100%になるように設定してください。（現在: ${totalRtp}%）`}
            {errorType === 'db_character' && `データベースエラー（gacha_characters）: ${errorMsg}`}
            {errorType === 'db_rtp' && `データベースエラー（gacha_rtp_config）: ${errorMsg}`}
          </p>
        </div>
      )}


      <div className="space-y-4">
        {entries.map(([characterId, { character, rtp }]) => {
          const totalRtp =
            (Number(rtp?.rarity_n ?? 0) +
              Number(rtp?.rarity_r ?? 0) +
              Number(rtp?.rarity_sr ?? 0) +
              Number(rtp?.rarity_ssr ?? 0) +
              Number(rtp?.rarity_ur ?? 0) +
              Number(rtp?.rarity_lr ?? 0)) || 0;

          return (
            <form
              key={characterId}
              action={updateCharacterConfig}
              className="space-y-4 rounded-3xl border border-accent/25 bg-card/70 p-6 shadow-library-card"
            >
              <input type="hidden" name="characterId" value={characterId} />
              <input type="hidden" name="characterName" value={character.character_name} />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Character</p>
                  <h2 className="text-xl font-bold">{character.character_name}</h2>
                  <p className="text-xs text-secondary">ID: {characterId}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={character.is_active}
                      className="h-4 w-4 rounded border-accent/40 bg-transparent"
                    />
                    <span>ガチャ対象に含める</span>
                  </label>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-secondary">出現比率</span>
                    <input
                      type="number"
                      name="weight"
                      min={0}
                      step={1}
                      defaultValue={character.weight ?? 0}
                      className="w-20 rounded-xl border border-accent/30 bg-black/30 px-2 py-1 text-right text-sm"
                    />
                    <span className="text-secondary">pt</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Rarity Distribution</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {([
                      ['N', rtp?.rarity_n ?? 35],
                      ['R', rtp?.rarity_r ?? 25],
                      ['SR', rtp?.rarity_sr ?? 20],
                      ['SSR', rtp?.rarity_ssr ?? 12],
                      ['UR', rtp?.rarity_ur ?? 6],
                      ['LR', rtp?.rarity_lr ?? 2],
                    ] as const).map(([label, value]) => (
                      <label key={label} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2">
                        <span className="font-medium">{label}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            name={`rarity_${label}`}
                            min={0}
                            max={100}
                            step={1}
                            defaultValue={Number(value)}
                            className="w-20 rounded-lg border border-accent/30 bg-black/40 px-2 py-1 text-right text-xs"
                          />
                          <span className="text-[11px] text-secondary">%</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-secondary">合計: {totalRtp.toFixed(1)}%</p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Donden</p>
                  <div className="space-y-2 rounded-xl bg-black/20 p-4 text-sm">
                    <label className="flex items-center justify-between gap-2">
                      <span>どんでん返し発生率</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="dondenRate"
                          min={0}
                          max={100}
                          step={1}
                          defaultValue={Number(rtp?.donden_rate ?? 15)}
                          className="w-20 rounded-lg border border-accent/30 bg-black/40 px-2 py-1 text-right text-xs"
                        />
                        <span className="text-[11px] text-secondary">%</span>
                      </div>
                    </label>
                    <p className="text-xs text-secondary">
                      reversal video &amp; dondenRoutes を持つカードのみが対象になります。
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-400/80 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  このキャラクターの設定を保存
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
