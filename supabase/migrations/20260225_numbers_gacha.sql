-- numbers gacha: settings / scenarios / results / assets
-- 独立プレフィックス numbers_gacha_*

-- 設定テーブル
CREATE TABLE IF NOT EXISTS numbers_gacha_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active         BOOLEAN       NOT NULL DEFAULT true,
  loss_rate         DECIMAL(5,2)  NOT NULL DEFAULT 60.0, -- ハズレ率 (%). 当選率 = 100 - loss_rate
  star_distribution JSONB         NOT NULL DEFAULT '[15,13,12,11,10,9,8,7,5,4,4,2]', -- ★1〜★12 の比率（合計100想定）
  early_miss_enabled BOOLEAN      NOT NULL DEFAULT true,
  early_miss_min_count INTEGER    NOT NULL DEFAULT 3,
  revival_rate       DECIMAL(5,2) NOT NULL DEFAULT 5.0,
  demotion_enabled   BOOLEAN      NOT NULL DEFAULT true,
  max_promotions     INTEGER      NOT NULL DEFAULT 4,
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_by        TEXT
);

-- 初期レコード（固定IDで管理）
INSERT INTO numbers_gacha_settings (id, is_active, loss_rate, star_distribution, early_miss_enabled, early_miss_min_count, revival_rate, demotion_enabled, max_promotions)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  true,
  60.0,
  '[15,13,12,11,10,9,8,7,5,4,4,2]',
  true,
  3,
  5.0,
  true,
  4
)
ON CONFLICT (id) DO NOTHING;

-- シナリオテーブル
CREATE TABLE IF NOT EXISTS numbers_gacha_scenarios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_code  TEXT UNIQUE NOT NULL,
  label          TEXT NOT NULL,
  description    TEXT,
  result_type    TEXT NOT NULL CHECK (result_type IN (
    'miss','star1','star2','star3','star4','star5','star6','star7','star8','star9','star10','star11','star12'
  )),
  sequence       JSONB NOT NULL,
  puchun_index   INTEGER,
  final_stage    TEXT NOT NULL DEFAULT 'first' CHECK (final_stage IN ('first','second','third','final')),
  weight         INTEGER NOT NULL DEFAULT 10,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  is_custom      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     TEXT
);

CREATE INDEX IF NOT EXISTS numbers_gacha_scenarios_result_idx ON numbers_gacha_scenarios (result_type);

-- 抽選結果ログ
CREATE TABLE IF NOT EXISTS numbers_gacha_results (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            TEXT,
  session_id         TEXT,
  result_type        TEXT NOT NULL,
  scenario_id        UUID REFERENCES numbers_gacha_scenarios (id),
  scenario_code      TEXT,
  final_stage        TEXT,
  puchun_triggered   BOOLEAN DEFAULT false,
  revival_triggered  BOOLEAN DEFAULT false,
  total_video_count  INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS numbers_gacha_results_created_idx ON numbers_gacha_results (created_at DESC);

-- 動画アセット管理（将来の差し替え用）
CREATE TABLE IF NOT EXISTS numbers_gacha_video_assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key        TEXT UNIQUE NOT NULL,
  file_name        TEXT NOT NULL,
  storage_path     TEXT NOT NULL,
  file_size_bytes  BIGINT,
  duration_seconds NUMERIC(6,2),
  stage            TEXT,
  number_value     INTEGER,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by      TEXT
);

-- RLS
ALTER TABLE numbers_gacha_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE numbers_gacha_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE numbers_gacha_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE numbers_gacha_video_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read numbers_gacha_settings" ON numbers_gacha_settings FOR SELECT USING (true);
CREATE POLICY "Service role can manage numbers_gacha_settings" ON numbers_gacha_settings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read numbers_gacha_scenarios" ON numbers_gacha_scenarios FOR SELECT USING (true);
CREATE POLICY "Service role can manage numbers_gacha_scenarios" ON numbers_gacha_scenarios FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read numbers_gacha_results" ON numbers_gacha_results FOR SELECT USING (true);
CREATE POLICY "Service role can manage numbers_gacha_results" ON numbers_gacha_results FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read numbers_gacha_video_assets" ON numbers_gacha_video_assets FOR SELECT USING (true);
CREATE POLICY "Service role can manage numbers_gacha_video_assets" ON numbers_gacha_video_assets FOR ALL USING (true) WITH CHECK (true);
