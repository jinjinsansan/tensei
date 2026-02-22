-- バトルガチャ設定テーブル（ON/OFF, RTP, 各種レート）
CREATE TABLE IF NOT EXISTS battle_gacha_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled    BOOLEAN       NOT NULL DEFAULT false,
  loss_rate     DECIMAL(5,2)  NOT NULL DEFAULT 60.0,
  reversal_rate DECIMAL(5,2)  NOT NULL DEFAULT 15.0,
  donden_rate   DECIMAL(5,2)  NOT NULL DEFAULT 15.0,
  -- star_distribution: [★1,★2,★3,...,★12] 合計100の配列
  star_distribution JSONB     NOT NULL DEFAULT '[20,20,15,15,7.5,7.5,4.5,4.5,2,2,1,1]',
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 初期レコード（固定IDで管理）
INSERT INTO battle_gacha_settings (id, is_enabled, loss_rate, reversal_rate, donden_rate, star_distribution)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  false,
  60.0,
  15.0,
  15.0,
  '[20,20,15,15,7.5,7.5,4.5,4.5,2,2,1,1]'
)
ON CONFLICT (id) DO NOTHING;

-- RLS: admin のみ更新可能、全員が読み取り可能
ALTER TABLE battle_gacha_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read battle_gacha_settings"
  ON battle_gacha_settings FOR SELECT USING (true);

CREATE POLICY "Service role can update battle_gacha_settings"
  ON battle_gacha_settings FOR ALL USING (true) WITH CHECK (true);
