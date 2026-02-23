-- バトルガチャ：高★側の勝率設定カラム追加
ALTER TABLE battle_gacha_settings
  ADD COLUMN IF NOT EXISTS high_star_win_rate DECIMAL(5,2) NOT NULL DEFAULT 70.0;

-- 既存レコードに初期値を設定
UPDATE battle_gacha_settings
  SET high_star_win_rate = 70.0
  WHERE id = '00000000-0000-0000-0000-000000000002';
