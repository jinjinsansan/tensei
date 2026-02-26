-- カウントダウンチャレンジ２ ガチャ設定テーブル
CREATE TABLE IF NOT EXISTS cd2_gacha_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000005'::uuid,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  -- ハズレ率 (0-100%)
  loss_rate NUMERIC(5,2) NOT NULL DEFAULT 60,
  -- どんでん返し率: ハズレのうち何%がどんでん返しになるか (0-100%)
  donden_rate NUMERIC(5,2) NOT NULL DEFAULT 10,
  -- パトライト率: 当たりのうち何%にパトライト差し込みが入るか (0-100%) ≈1/20
  patlite_rate NUMERIC(5,2) NOT NULL DEFAULT 5,
  -- フリーズ率: 当たりのうち何%がフリーズ当たりになるか (0-100%) ≈1/50
  freeze_rate NUMERIC(5,2) NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 初期レコード挿入
INSERT INTO cd2_gacha_settings (id)
  VALUES ('00000000-0000-0000-0000-000000000005')
  ON CONFLICT DO NOTHING;
