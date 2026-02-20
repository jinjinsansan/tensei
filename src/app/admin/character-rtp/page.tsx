import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { AdminCard, AdminPageHero } from '@/components/admin/admin-ui';
import { getStarDistributionFromRow } from '@/lib/data/gacha';
import { getServiceSupabase } from '@/lib/supabase/service';
import type { Tables } from '@/types/database';
import { CharacterForm } from './character-form';

type GachaCharacterRow = Tables<'gacha_characters'>;
type GachaRtpRow = Tables<'gacha_rtp_config'>;

const BUILTIN_CHARACTERS: { id: string; name: string }[] = [
  { id: 'kenta', name: '健太' },
  { id: 'shoichi', name: '正一' },
  { id: 'tatumi', name: '辰巳剛' },
  { id: 'yahei', name: '弥平' },
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
  
  console.log('[updateCharacterConfig] Validation passed (pre-star parsing):', {
    isActive,
    weight,
  });
  const dondenRaw = Number(formData.get('dondenRate') ?? 0);
  const dondenRate = Number.isFinite(dondenRaw) ? Math.min(Math.max(dondenRaw, 0), 100) : 0;

  const starValues = Array.from({ length: 12 }, (_, index) => {
    const fieldName = `star_${index + 1}`;
    const raw = Number(formData.get(fieldName) ?? 0);
    return Number.isFinite(raw) ? raw : 0;
  });

  const totalStar = starValues.reduce((sum, value) => sum + value, 0);
  if (Number.isFinite(totalStar) && Math.abs(totalStar - 100) > 0.1) {
    console.error('[updateCharacterConfig] Star distribution validation failed:', { totalStar });
    return redirect(`/admin/character-rtp?error=star_total&total=${totalStar.toFixed(1)}`);
  }

  console.log('[updateCharacterConfig] Star distribution totals:', { totalStar });

  const [rarity_n, rarity_r, rarity_sr, rarity_ssr, rarity_ur, rarity_lr] = [
    starValues[0] + starValues[1],
    starValues[2] + starValues[3],
    starValues[4] + starValues[5],
    starValues[6] + starValues[7],
    starValues[8] + starValues[9],
    starValues[10] + starValues[11],
  ];

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
        rarity_n,
        rarity_r,
        rarity_sr,
        rarity_ssr,
        rarity_ur,
        rarity_lr,
        star_distribution: starValues,
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
      <AdminPageHero
        eyebrow="Character RTP"
        title="キャラクター別RTP設定"
        description="キャラクターのウエイト、★別RTP、どんでん返し発生率を調整します。"
      />

      {successFlag === 'true' && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
          <p className="text-sm font-semibold text-emerald-300">✅ 保存しました</p>
        </div>
      )}

      {errorType && (
        <div className="rounded-2xl border border-red-400/40 bg-red-400/10 p-4">
          <p className="text-sm font-semibold text-red-300">❌ エラー</p>
          <p className="mt-1 text-xs text-red-200">
            {errorType === 'missing_character_id' && 'キャラクターIDが指定されていません。'}
            {errorType === 'last_character' && '最低1つのキャラクターを有効にする必要があります。'}
            {errorType === 'star_total' && `★分布の合計が100%になるように設定してください。（現在: ${totalRtp}%）`}
            {errorType === 'db_character' && `データベースエラー（gacha_characters）: ${errorMsg}`}
            {errorType === 'db_rtp' && `データベースエラー（gacha_rtp_config）: ${errorMsg}`}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {entries.map(([characterId, { character, rtp }]) => (
          <CharacterForm
            key={characterId}
            characterId={characterId}
            characterName={character.character_name}
            isActive={character.is_active}
            weight={Number(character.weight ?? 0)}
            starDistribution={getStarDistributionFromRow(rtp ?? undefined)}
            dondenRate={Number(rtp?.donden_rate ?? 15)}
            action={updateCharacterConfig}
          />
        ))}
      </div>
      
      <AdminCard>
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-accent">🔍 デバッグ情報</summary>
          <div className="mt-4 space-y-2 text-xs font-mono">
            <p>総キャラクター数: {entries.length}</p>
            <p>有効なキャラクター: {gachaCharacters.filter(c => c.is_active).length}</p>
            <pre className="overflow-auto rounded bg-black/40 p-2">
              {JSON.stringify(gachaCharacters.map(c => ({
                id: c.character_id,
                name: c.character_name,
                active: c.is_active,
                weight: c.weight
              })), null, 2)}
            </pre>
          </div>
        </details>
      </AdminCard>
    </div>
  );
}
