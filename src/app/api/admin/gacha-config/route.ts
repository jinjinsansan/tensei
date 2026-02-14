import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lossRate, rtpConfig, reversalRates, characterWeights } = body;

    const supabase = getServiceSupabase();

    // lossRate は reversal_rates.lossRate として保存する
    const mergedReversalRates = {
      ...(reversalRates ?? {}),
      // 0〜1 の範囲にクランプして保存
      lossRate: typeof lossRate === 'number' ? Math.min(Math.max(lossRate, 0), 1) : undefined,
    };

    // gacha_config テーブルを更新
    const { error } = await supabase
      .from('gacha_config')
      .update({
        rtp_config: rtpConfig,
        reversal_rates: mergedReversalRates,
        character_weights: characterWeights,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', 'default');

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
