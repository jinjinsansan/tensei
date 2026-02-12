# SONSHI GACHA Architecture (Step 1 Export)

尊師ガチャ（現行 V4 プレイヤー）の設計・ロジック・アーキテクチャを新規プロジェクトへ移植するためのリファレンスです。コードのコピペではなく、ここに記録した構造と判断基準を踏まえてクリーンに再構築してください。

---

## 0. 全体概要

- **スタック**: Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4 + Supabase (DB/Auth/RLS) + Cloudflare R2 (動画/CDN) + LINE Messaging API + Resend (メール)
- **ドメイン/環境**: `sonshigacha.com`。main ブランチ push → Vercel ビルド。`.deploy-trigger` ファイルを touch して強制再デプロイする運用。
- **大枠**: `src/components/gacha/gacha-v4-player.tsx` がクライアント側の体験を司り、`/api/gacha/v4/play` でシナリオ生成、`/api/gacha/v4/result` でカード発行。Supabase には V4 専用の `story_videos` / `story_scenarios` / `donden_rate_settings` 等がある。
- **ガードレール**: RLS でユーザー毎にデータを絞り、ガチャ結果は `gacha_history` + `gacha_results` + `card_inventory` の3層で追跡。どんでん返し・追撃は per-star 設定テーブルで即時更新可能。

---

## 1. プロジェクト全体構造

### 1.1 使用技術

| レイヤー | 採用技術 | 用途 |
| --- | --- | --- |
| フロント | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Framer Motion | SPA ライクな 9:16 ガチャ UI、アニメーション、レスポンシブ対応 |
| 状態管理 | React hooks, `useState`/`useEffect`, Zustand (ticket store) | 軽量なクライアント状態保持 |
| API/通信 | Next API Routes, Fetch API | gacha/play, result, tickets など |
| バックエンド | Supabase Postgres + Edge Functions (RPC) | 認証、RTP/Donden/Scenario 管理、カード在庫 |
| ストレージ | Supabase Storage + Cloudflare R2 (scripts/upload-r2.js) | 動画・telop 画像の配信 |
| 外部連携 | LINE Messaging API, Resend, AWS SDK (S3/R2), Standard Webhooks | LINE 連携、メール送信、R2 アップロード |

### 1.2 デプロイ・環境

- **Vercel**: `main` ブランチ push で自動デプロイ。`.deploy-trigger` を更新すると再ビルドを強制できる（CI キャッシュ破棄用途）。
- **Supabase**: `supabase/migrations` で DB スキーマを Git 管理。新規テーブルは `supabase db push` 相当で反映。
- **Env**: `env.local` で Supabase keys, LINE secrets, Cloudflare R2 credentials 等を管理。Next サーバー内では `getServerEnv()` 経由で参照。

### 1.3 ディレクトリ構成（全ファイル一覧）

> `node_modules`, `.next`, `.git`, `.turbo`, `venv/.venv` は除外。

<details>
<summary>クリックで展開</summary>

```text
DEVELOPMENT_PLAN.md
INITIAL_PROMPT.md
NEXT_PROMPT.md
README.md
deploy-trigger
docs/DATABASE.md
docs/FEATURES.md
docs/MULTI_GACHA_SCENARIO.md
docs/PAGES.md
docs/gacha-video-guidelines.md
env.local
env.local.example
eslint.config.mjs
gitignore
next-env.d.ts
next.config.ts
package-lock.json
package.json
postcss.config.mjs
public/apple-touch-icon.png
public/dev-videos/それなので剛掌波.mp4
public/dev-videos/ダブル激熱.mp4
public/dev-videos/伊東登場.mp4
public/dev-videos/尊師チャンスロゴ.mp4
public/dev-videos/激熱漢字レインボー.mp4
public/dev-videos/灼熱チャンス.mp4
public/dev-videos/神田清人登場.mp4
public/dev-videos/２秒readygo.mp4
public/file.svg
public/gekia-tsu.mp4
public/gekia-tsu2.mp4
public/globe.svg
public/icon-large.png
public/icon.png
public/iraira.png
public/ito.png
public/kakutei.mp4
public/next.svg
public/opensonshi.png
public/sonshi.jpg
public/telop/big-win.png
public/telop/chase.png
public/telop/continue-1.png
public/telop/continue-2.png
public/telop/continue-3.png
public/telop/continue-4.png
public/telop/continue-5.png
public/telop/jackpot.png
public/telop/lose.png
public/telop/win.png
public/ticket-illustration-basic.svg
public/ticket-illustration-epic.svg
public/ticket-illustration-premium.svg
public/ticket-illustration-vip.svg
public/ticket-illustration.svg
public/vercel.svg
public/videos/1_S01.mp4
public/videos/1_S02.mp4
public/videos/1_S03.mp4
public/videos/1_S04.mp4
public/videos/1_S05.mp4
public/videos/1_S06.mp4
public/videos/2_C01.mp4
public/videos/2_C02.mp4
public/videos/2_C03.mp4
public/videos/2_C04.mp4
public/videos/2_C05.mp4
public/videos/2_C06.mp4
public/videos/3_B01.mp4
public/videos/3_continue.mp4
public/videos/3_lose.mp4
public/videos/4_T01.mp4
public/videos/4_T02.mp4
public/videos/4_T03.mp4
public/videos/4_T04.mp4
public/videos/4_T05.mp4
public/videos/4_T06.mp4
public/videos/4_continue.mp4
public/videos/4_lose.mp4
public/videos/5_E01.mp4
public/videos/5_E02.mp4
public/videos/5_E03.mp4
public/videos/5_E04.mp4
public/videos/5_E05.mp4
public/videos/5_E06.mp4
public/videos/5_continue.mp4
public/videos/5_lose.mp4
public/videos/6_F01.mp4
public/videos/6_F02.mp4
public/videos/6_F03.mp4
public/videos/6_F04.mp4
public/videos/6_F05.mp4
public/videos/6_F06.mp4
public/videos/6_continue.mp4
public/videos/6_lose.mp4
public/videos/7_G01.mp4
public/videos/7_G02.mp4
public/videos/7_G03.mp4
public/videos/7_G04.mp4
public/videos/7_G05.mp4
public/videos/7_G06.mp4
public/videos/7_lose.mp4
public/videos/7_tsuigeki.mp4
public/videos/7_win.mp4
public/videos/8_H01.mp4
public/videos/8_H02.mp4
public/videos/8_fail.mp4
public/videos/8_success.mp4
public/videos/C01.mp4
public/videos/C02.mp4
public/videos/C03.mp4
public/videos/C04.mp4
public/videos/C05.mp4
public/videos/C06.mp4
public/videos/S01.mp4
public/videos/S02.mp4
public/videos/S03.mp4
public/videos/S04.mp4
public/videos/S05.mp4
public/videos/S06.mp4
public/videos/frankel_appear.mp4
public/videos/frankel_win.mp4
public/videos/guri_cry.mp4
public/videos/guri_laugh.mp4
public/videos/guri_relieved.mp4
public/videos/guri_scared.mp4
public/videos/ito_cry.mp4
public/videos/ito_laugh.mp4
public/videos/ito_relieved.mp4
public/videos/ito_scared.mp4
public/videos/kakeru_appear.mp4
public/videos/kakeru_fail.mp4
public/window.svg
scripts/upload-r2.js
src/app/(auth)/actions.ts
src/app/(auth)/email-change/page.tsx
src/app/(auth)/layout.tsx
src/app/(auth)/login/page.tsx
src/app/(auth)/register/page.tsx
src/app/(auth)/reset/confirm/page.tsx
src/app/(auth)/reset/page.tsx
src/app/(auth)/verify/page.tsx
src/app/(main)/collection/[cardId]/page.tsx
src/app/(main)/collection/page.tsx
src/app/(main)/gacha/page.tsx
src/app/(main)/home/page.tsx
src/app/(main)/layout.tsx
src/app/(main)/layout/
src/app/(main)/menu/page.tsx
src/app/(main)/mypage/history/page.tsx
src/app/(main)/mypage/invite/page.tsx
src/app/(main)/mypage/line/page.tsx
src/app/(main)/mypage/page.tsx
src/app/(main)/mypage/tickets/page.tsx
src/app/(main)/purchase/page.tsx
src/app/(main)/social/page.tsx
src/app/admin/cards/[id]/page.tsx
src/app/admin/cards/page.tsx
src/app/admin/donden/page.tsx
src/app/admin/layout.tsx
src/app/admin/page.tsx
src/app/admin/probability/page.tsx
src/app/admin/referrals/page.tsx
src/app/admin/rtp/page.tsx
src/app/admin/stats/page.tsx
src/app/admin/story/page.tsx
src/app/admin/tsuigeki/page.tsx
src/app/admin/users/[id]/page.tsx
src/app/admin/users/page.tsx
src/app/api/auth/send-email/
src/app/api/collection/route.ts
src/app/api/gacha/[id]/result/route.ts
src/app/api/gacha/[id]/skip/route.ts
src/app/api/gacha/[id]/videos/route.ts
src/app/api/gacha/history/route.ts
src/app/api/gacha/multi/[sessionId]/next/route.ts
src/app/api/gacha/multi/[sessionId]/route.ts
src/app/api/gacha/multi/start/route.ts
src/app/api/gacha/play/route.ts
src/app/api/gacha/v3/play/route.ts
src/app/api/gacha/v3/result/route.ts
src/app/api/gacha/v3/video-proxy/route.ts
src/app/api/gacha/v4/play/route.ts
src/app/api/gacha/v4/result/route.ts
src/app/api/gachas/[id]/pull/route.ts
src/app/api/gachas/route.ts
src/app/api/line/link/route.ts
src/app/api/line/webhook/route.ts
src/app/api/main-app/route.ts
src/app/api/referral/code/route.ts
src/app/api/referral/stats/route.ts
src/app/api/referral/verify/route.ts
src/app/api/tickets/bonus/route.ts
src/app/api/tickets/route.ts
src/app/favicon.ico
src/app/gacha/demo/page.tsx
src/app/gacha/dev-five/page.tsx
src/app/gacha/layout.tsx
src/app/gacha/multi/[sessionId]/page.tsx
src/app/gacha/multi/page.tsx
src/app/gacha/v3/page.tsx
src/app/globals.css
src/app/invite/[code]/page.tsx
src/app/layout.tsx
src/app/page.tsx
src/components/admin/story-sequence-builder.tsx
src/components/collection/collection-list.tsx
src/components/gacha/gacha-detail-experience.tsx
src/components/gacha/gacha-draw-panel.tsx
src/components/gacha/gacha-history.tsx
src/components/gacha/gacha-v2-player.tsx
src/components/gacha/gacha-v3-player.tsx
src/components/gacha/gacha-v4-player.tsx
src/components/gacha/multi-gacha-demo.tsx
src/components/gacha/multi-gacha-dev-five.tsx
src/components/gacha/multi-gacha-lobby.tsx
src/components/gacha/multi-gacha-session.tsx
src/components/home/home-dashboard.tsx
src/components/home/login-bonus-card-client.tsx
src/components/home/login-bonus-card.tsx
src/components/home/ticket-balance-carousel.tsx
src/components/landing/splash-gateway.tsx
src/components/layout/tab-bar.tsx
src/components/line/line-link-card.tsx
src/components/menu/menu-screen.tsx
src/components/providers/main-app-provider.tsx
src/components/referral/invite-claim-card.tsx
src/components/referral/referral-invite-panel.tsx
src/constants/gacha.ts
src/constants/tickets.ts
src/hooks/use-login-bonus.ts
src/lib/admin.ts
src/lib/app/main-app.ts
src/lib/auth/crypto.ts
src/lib/auth/emails.ts
src/lib/auth/session.ts
src/lib/auth/tokens.ts
src/lib/data/gacha.ts
src/lib/data/tickets.ts
src/lib/env.ts
src/lib/gacha/pool.ts
src/lib/gacha/rarity.ts
src/lib/gacha/scenario-constants.ts
src/lib/gacha/scenario-generator.ts
src/lib/gacha/scenario.ts
src/lib/gacha/settings.ts
src/lib/gacha/v3/data.ts
src/lib/gacha/v3/generator.ts
src/lib/gacha/v3/selectors.ts
src/lib/gacha/v3/types.ts
src/lib/gacha/v3/utils.ts
src/lib/gacha/v4/data.ts
src/lib/gacha/v4/generator.ts
src/lib/gacha/v4/types.ts
src/lib/services/
src/lib/supabase/client.ts
src/lib/supabase/middleware.ts
src/lib/supabase/service.ts
src/lib/utils/api.ts
src/lib/utils/cn.ts
src/lib/utils/gacha.ts
src/lib/utils/tickets.ts
src/stores/ticket-store.ts
src/types/database.ts
supabase/migrations/20260205_sonshi_custom_auth.sql
supabase/migrations/20260205_sonshi_initial.sql
supabase/migrations/20260205_sonshi_login_bonus_and_history.sql
supabase/migrations/20260205_sonshi_multi_gacha_rpc.sql
supabase/migrations/20260205_sonshi_probability_history.sql
supabase/migrations/20260205_sonshi_referral_code_multi_use.sql
supabase/migrations/20260206_sonshi_ticket_balances_rpc.sql
supabase/migrations/20260206_sonshi_touch_last_login_on_session.sql
supabase/migrations/20260208_gacha_v2_schema.sql
supabase/migrations/20260208_seed_star_cards.sql
supabase/migrations/20260210_gacha_v3_schema.sql
supabase/migrations/20260211_gacha_v4_result_schema.sql
supabase/migrations/20260211_gacha_v4_story.sql
supabase/migrations/20260211_rtp_settings_fix.sql
supabase/migrations/20260211_story_scenario_patterns_add.sql
tailwind.config.ts
tsconfig.json
tsconfig.tsbuildinfo
```

</details>

---

## 2. データベース設計（V4で実際に利用するテーブルのみ）

各 CREATE 文は Supabase migration から引用/統合した最終形です。RLS ルールやインデックスも開発時に有効化済みです。

### 2.1 ユーザー・チケット・カード系

#### `app_users`

```sql
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);
```

- **役割**: サービスポータル用の独自 auth ユーザー。Supabase の `auth.users` とは切り離して運用。
- **関係**: `user_tickets.owner_id`, `card_inventory.owner_id`, `gacha_history.user_id`, `gacha_results.user_id` など全てここを参照。

#### `ticket_types`

```sql
CREATE TABLE public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  color VARCHAR(20),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- **役割**: フリーチケット/ベーシック等のメタデータ。`code` で API 通知。
- **関係**: `gachas.ticket_type_id`, `user_tickets.ticket_type_id` が参照。

#### `user_tickets`

```sql
CREATE TABLE public.user_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
  ticket_type_id UUID REFERENCES public.ticket_types(id) NOT NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

- **役割**: 各ユーザーのチケット残高。
- **RLS**: `auth.uid() = user_id` のみ参照可。`/api/gacha/v4/play` で 1 枚消費。

#### `cards`

```sql
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('N','R','SR','SSR','UR','LR')),
  star INTEGER DEFAULT 1,
  max_supply INTEGER NOT NULL,
  current_supply INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  person_name TEXT,
  card_style TEXT CHECK (card_style IN ('realphoto','3d','illustration','pixel')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- **役割**: 実カード情報（★レベルは `star` 列）。
- **設計メモ**: `max_supply/current_supply` で発行数を制御。`/api/gacha/v4/result` で `current_supply` をインクリメント。

#### `card_inventory`

```sql
CREATE TABLE public.card_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.cards(id) NOT NULL,
  serial_number INTEGER NOT NULL CHECK (serial_number > 0),
  owner_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
  obtained_at TIMESTAMPTZ DEFAULT now(),
  obtained_via TEXT NOT NULL CHECK (
    obtained_via IN ('single_gacha','multi_gacha','trade','admin_grant','gacha_v2','gacha_v3','gacha_v4')
  ),
  gacha_result_id UUID,
  UNIQUE(card_id, serial_number)
);
```

- **役割**: 所持カード。`obtained_via` を V4 用に拡張。
- **関係**: `gacha_results.id` を外部キー的に保持（`gacha_result_id`）。

### 2.2 ガチャ制御テーブル

#### `rtp_settings`

```sql
CREATE TABLE public.rtp_settings (
  star INTEGER PRIMARY KEY,
  probability NUMERIC(6,4) NOT NULL,
  min_koma INTEGER,
  max_koma INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);
```

- **役割**: ★1〜★12 の排出率と演出コマ長の範囲。`drawStar` がここを参照。

#### `donden_rate_settings`

```sql
CREATE TABLE public.donden_rate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_rating INTEGER UNIQUE NOT NULL CHECK (star_rating BETWEEN 1 AND 12),
  donden_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

- **役割**: ★ごとのどんでん発動率 (% 表記)。管理画面 `admin/donden` から即時更新。
- **利用**: `loadDondenRateSettings()` で `Record<number, number>` に展開し `generateStoryPlay()` で使用。

#### `tsuigeki_settings`

```sql
CREATE TABLE public.tsuigeki_settings (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  star INTEGER UNIQUE NOT NULL,
  success_rate NUMERIC(5,2) NOT NULL,
  card_count_on_success INTEGER NOT NULL DEFAULT 2,
  third_card_rate NUMERIC(5,2),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);
```

- **役割**: ★10〜12 の追撃チャンス設定（成功率と成功時カード枚数、★12 では 3 枚目の確率）。

#### `story_videos` / `story_scenarios`

```sql
CREATE TABLE public.story_videos (
  id VARCHAR(10) PRIMARY KEY,
  category VARCHAR(32) NOT NULL,
  filename VARCHAR(200) NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 6,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.story_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  star_rating INTEGER NOT NULL CHECK (star_rating BETWEEN 1 AND 12),
  result VARCHAR(20) NOT NULL CHECK (result IN ('lose','small_win','win','big_win','jackpot')),
  video_sequence JSONB NOT NULL,
  has_chase BOOLEAN DEFAULT false,
  chase_result VARCHAR(10) CHECK (chase_result IN ('success','fail')),
  is_donden BOOLEAN DEFAULT false,
  weight INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

- **役割**: V4 専用の動画マスタ／シナリオマスタ。`video_sequence` は動画 ID の配列。
- **派生**: `story_scenario_id` が `gacha_history` に保存され、結果参照とトレースが可能。

#### `gacha_history`

```sql
CREATE TABLE public.gacha_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  star INTEGER NOT NULL,
  scenario JSONB NOT NULL,
  result TEXT,
  is_donden BOOLEAN NOT NULL DEFAULT false,
  donden_type TEXT,
  has_tsuigeki BOOLEAN NOT NULL DEFAULT false,
  tsuigeki_result TEXT,
  cards_count INTEGER NOT NULL DEFAULT 1,
  card_count INTEGER,
  koma_count INTEGER,
  video_sequence JSONB,
  story_scenario_id UUID REFERENCES public.story_scenarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- **役割**: 単発ガチャ 1 回分の抽選情報。`scenario` には `generateStoryPlay()` の返り値全体を保存。`cards_count/card_count` は結果 API のフェールセーフ用。

#### `gacha_results`

```sql
CREATE TABLE public.gacha_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  gacha_id UUID REFERENCES public.gachas(id) ON DELETE SET NULL,
  history_id UUID REFERENCES public.gacha_history(id) ON DELETE SET NULL,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  obtained_via TEXT NOT NULL CHECK (obtained_via IN ('single_gacha','multi_gacha','gacha_v2','gacha_v3','gacha_v4')),
  session_id UUID REFERENCES public.multi_gacha_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- **役割**: 実際に配布したカードのログ。V4 では `history_id` 経由で紐付け、`gacha_id` は `NULL`。
- **連動**: `card_inventory.gacha_result_id`、`/api/gacha/history` でジョイン。

### 2.3 リレーション要約

- `app_users 1 - N user_tickets / card_inventory / gacha_history / gacha_results`
- `ticket_types 1 - N user_tickets`、`gachas`
- `gacha_history 1 - N gacha_results` (history_id 経由)
- `gacha_results 1 - 1 card_inventory` (シリアル付きカード付与)
- `story_scenarios 1 - N gacha_history`
- `cards 1 - N card_inventory` & `cards 1 - N gacha_results`
- `rtp_settings` / `donden_rate_settings` / `tsuigeki_settings` → 読み取り専用マスタ（管理画面で更新）

---

## 3. ガチャエンジン（V4）

### 3.1 RTP と ★ 抽選

`src/lib/gacha/v3/generator.ts` の `drawStar` を V4 でも流用。RTP テーブルを昇順ソートし、0-100 の乱数で★を決定。

```ts
export function drawStar(rtpSettings: RtpSetting[]): number {
  const ordered = [...rtpSettings].sort((a, b) => a.star - b.star);
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const setting of ordered) {
    cumulative += Number(setting.probability);
    if (roll < cumulative) return setting.star;
  }
  return ordered[0]?.star ?? 1;
}
```

### 3.2 シナリオ生成フロー

`src/lib/gacha/v4/generator.ts` の `generateStoryPlay()` が中核。RTP→シナリオ→追撃→カード枚数までを一括で決定し `StoryPlay` を返す。

```ts
export async function generateStoryPlay(): Promise<StoryPlay> {
  const [rtpSettings, scenarios, videos, dondenRates, chaseSettings] = await Promise.all([
    loadRtpSettings(),
    loadStoryScenarios(),
    loadStoryVideos(),
    loadDondenRateSettings(),
    loadChaseSettings(),
  ]);

  const star = drawStar(rtpSettings);
  const starScenarios = scenarios.filter((s) => s.star_rating === star);
  const dondenPool = starScenarios.filter((s) => s.is_donden === true);
  const normalPool = starScenarios.filter((s) => s.is_donden !== true);

  const dondenRate = dondenRates[star] ?? 0;
  const useDonden = dondenPool.length > 0 && Math.random() * 100 < dondenRate;
  const basePool = useDonden ? dondenPool : normalPool;
  const pool = basePool.length ? basePool : starScenarios.length ? starScenarios : scenarios;

  let scenario = pool.length ? pickScenarioByWeight(pool) : randomChoice(scenarios);
  let chaseResult: 'success' | 'fail' | undefined = scenario.has_chase ? scenario.chase_result : undefined;

  if (scenario.has_chase) {
    const setting = chaseSettings[star];
    if (setting) {
      const successRoll = Math.random() * 100;
      const desiredResult = successRoll < setting.success_rate ? 'success' : 'fail';
      const chasePool = pool.filter((s) => s.has_chase && s.chase_result === desiredResult);
      if (chasePool.length) {
        scenario = pickScenarioByWeight(chasePool);
      }
      chaseResult = desiredResult;
    }
  }

  const resolvedStar = scenario.star_rating ?? star;
  const video_sequence = buildSequence(scenario, videos);
  const card_count = scenario.has_chase
    ? resolveChaseCardCount(resolvedStar, chaseResult, chaseSettings[resolvedStar])
    : RESULT_CARD_COUNTS[scenario.result] ?? 0;

  return {
    star: resolvedStar,
    scenario_id: scenario.id,
    result: scenario.result,
    video_sequence,
    has_chase: scenario.has_chase,
    chase_result: chaseResult,
    is_donden: scenario.is_donden === true,
    card_count,
  };
}
```

### 3.3 どんでん返し

- `donden_rate_settings` の % を参照して ★ ごとに独立判定。
- 該当シナリオが存在する場合のみ発火。なければ通常パターンにフォールバック。
- Scenario 自体に `is_donden` / `chase_result` が刻まれているため、プレイヤー側では `story.is_donden` を見るだけで演出を切り替えられる。

### 3.4 追撃（二段階転生）

- `resolveChaseCardCount()` でカード枚数を補正。★12 では `third_card_rate` により 3 枚目が抽選される。
- `generateStoryPlay()` の戻り値に `has_chase` / `chase_result` / `card_count` が入るので、API レスポンスからそのまま利用可能。

### 3.5 カード配布と在庫更新

- `/api/gacha/v4/play`: `generateStoryPlay()` を呼び、`gacha_history` にフルシナリオを保存、`gacha_id` をレスポンス。
- `/api/gacha/v4/result`: `history_id` から既存結果を探し、未配布なら `cards` テーブルを在庫確認しながら抽選 → `gacha_results` と `card_inventory` に同時挿入 → `cards.current_supply` を加算。
- API は失敗時に 500/400 を返し、フロントはカード取得リトライボタンで再呼び出し。

### 3.6 Telop / 動画同期

- `story.video_sequence` に `StorySequenceItem[]`（filename, duration）が入る。フロントは `GachaV4Player` で順に `fetch` し、`TelopOverlay` の variant を `result_display` から決定。
- テロップは `/public/telop/*.png` を読み込み、`TelopParticles` の Canvas と同期。続行/当たり/追撃など 10 種類の画像をランダムまたは結果別に表示。

---

## 4. API 一覧

### 4.1 ガチャ関連

| Method | Path | 説明 | 認証 | 主なレスポンス |
| --- | --- | --- | --- | --- |
| POST | `/api/gacha/v4/play` | V4 単発ガチャ開始。チケット消費→`generateStoryPlay()`→`gacha_history` へ保存。 | 必須（App セッション） | `{ success, gacha_id, story }` |
| POST | `/api/gacha/v4/result` | V4 のカード配布。`gacha_id` を受け取り `gacha_results` と `card_inventory` を作成。再取得にも対応。 | 必須 | `{ star, cards[], card_count }` |
| POST | `/api/gacha/v3/play` | 旧 V3 プレイヤー用 API。V4 では未使用だが後方互換のため残置。 | 必須 | `{ success, gacha_id, scenario }` |
| POST | `/api/gacha/v3/result` | V3 用カード配布。`gacha_results` に `history_id` が無い場合は `gacha_id` 列で参照。 | 必須 | `{ star, cards[], card_count }` |
| GET | `/api/gacha/[id]/videos` | V2/V3 シナリオの動画 ID から実ファイル URL を返す。 | 必須 | `{ videos: [{ id,url,duration }] }` |
| GET | `/api/gacha/[id]/result` | V2/V3 共通の結果取得。V4 でもレガシー互換のために `history_id` をサポート。 | 必須 | 同上 |
| POST | `/api/gacha/[id]/skip` | 再生スキップ→結果ページへ。UI 用の簡易リダイレクト。 | 必須 | `{ success, redirect }` |
| GET | `/api/gacha/history` | 直近 20 件の `gacha_results`（カード名/チケット種別付き）を返す。 | 必須 | `{ history: [...] }` |
| POST | `/api/gacha/multi/start` | 連続ガチャ開始（2/5/10 連）。RTP/在庫/チケット RPC を駆動し `multi_gacha_sessions` を作成。 | 必須 | `{ sessionId, totalPulls, status }` |
| GET/POST | `/api/gacha/multi/[sessionId]` | セッション状態取得＆結果集約。 | 必須 | セッション JSON |
| POST | `/api/gacha/multi/[sessionId]/next` | 連続ガチャの次の動画/カードシーケンスを返す。 | 必須 | `{ segment }` |

### 4.2 サポート API

| Method | Path | 概要 |
| --- | --- | --- |
| GET | `/api/collection` | `card_inventory` + `cards` を結合しコレクション画面へ供給。総所持数/図鑑数も返す。 |
| GET | `/api/tickets` | `user_tickets` の残高を返し、`ticket-balance-carousel` で使用。 |
| POST | `/api/tickets/bonus` | ログインボーナスや付与処理。Supabase RPC と連動。 |
| POST | `/api/referral/code` | 紹介コード生成/取得。 |
| GET | `/api/referral/stats` | 紹介実績を集計。 |
| POST | `/api/referral/verify` | 紹介コード検証。 |
| POST | `/api/line/link` | LINE アカウントのリンクを開始。 |
| POST | `/api/line/webhook` | LINE Webhook を受信し、署名検証後にユーザー状態を更新。 |
| GET | `/api/gachas` | 管理用のガチャ一覧/詳細。 |
| POST | `/api/gachas/[id]/pull` | 管理 or シミュレーション用途の手動排出。 |
| GET | `/api/main-app` | `MainAppProvider` 初期化用の設定フェッチ。 |

> すべての API は `getRequestAuthUser` で App セッションを検証し、未ログインの場合 401 を返す設計になっている。

---

## 5. フロントエンド（ガチャ体験）

### 5.1 `GachaV4Player`

1. **ステート管理**: `status`（"idle"｜"playing"｜"card"）、`story`, `videos`, `cards`, `telop`, `cardLoading` などを `useState` で保持。
2. **プレイ開始**: ボタン押下で `/api/gacha/v4/play` → `story` & `sequence` を取得し、STANDBY/COUNTDOWN を含む正規化配列に変換。
3. **動画再生**: `normalizedSequence` を `video` 要素で直列再生。各 `StorySequenceItem` には `result_display` が付与され、`TelopOverlay` が variant を判定。
4. **TelopOverlay**: テロップ画像 (`public/telop/*.png`) を `Image` で表示し、Canvas パーティクル (`TelopParticles`) を実行。継続は 5 種の画像からランダム抽選。
5. **Portal**: プレイヤーは `createPortal` で `document.body` 直下に描画し、カードフレームの CSS 影響を受けないようにしている（ユーザーが報告した「全画面化できない」不具合への対策）。
6. **カード表示**: 動画完了後に `/api/gacha/v4/result` を叩き、`CardReveal` モーダルで枚数に応じたグリッドを描画。`Link("/collection")` と「もう一度」ボタンを配置。
7. **レスポンシブ**: 9:16 前提レイアウト／safe-area 対応フッターボタン（NEXT/SKIP）を実装。AUTO 再生は廃止済み。

### 5.2 他 UI

- **Gacha Hall (`/gacha`)**: ガラス調のカード UI。各カードから `GachaV4Player` を `playVariant="round"` で埋め込み、円形メタリックボタンで起動。
- **Collection (`/collection`)**: グラデーションタイトル + `CollectionList` でカードをリスト表示。カードリセット時は Supabase script で `card_inventory` を直接削除。
- **Splash (`SplashGateway`)**: `opensonshi.png` をズーム＆ネオングローで表示し、トップ画面へ遷移。

---

## 6. 管理者パネル

各管理ページは `/admin` 以下で、`layout.tsx` が共通サイドバーを提供。主な機能:

1. **ダッシュボード (`/admin`)**: ショートカットカード（例: ストーリー管理）で各セクションに遷移。
2. **RTP 設定 (`/admin/rtp`)**: `rtp_settings` の確率・min/max コマ数をフォームで編集。変更即時 Supabase 更新。
3. **どんでん設定 (`/admin/donden`)**: `donden_rate_settings` を★毎に入力。該当★のシナリオ数を表示して不足を警告。
4. **追撃設定 (`/admin/tsuigeki`)**: `tsuigeki_settings` 用 UI。★10〜12 の成功率/カード枚数/3枚目率を編集。
5. **ストーリー管理 (`/admin/story`)**: `StorySequenceBuilder` を用いた GUI。動画グリッド（ホバー再生）、ドラッグ & ドロップ、テキスト編集を同期させ、`story_scenarios` を更新。カテゴリ／検索フィルターあり。
6. **カード & チケット**: `admin/cards`, `admin/users`, `admin/probability`, `admin/stats` 等でカードメタやユーザー残高を管理。

---

## 7. 動画・アセット管理

- **ローカル配置**: `/public/videos` に STANDBY (S01-S06), COUNTDOWN (C01-C06), JUDGE, RESULT などの MP4 を格納。`story_videos.filename` は Cloudflare R2 上の実ファイルと同期させる前提。
- **R2 連携**: `scripts/upload-r2.js` が boto3 を用いてローカル動画を R2 バケットへアップロード。Supabase ではファイル名のみ保持し、プレイヤーは CDN URL を組み立てて再生。
- **Telop 画像**: `/public/telop/*.png` に 10 種類（継続 5 + 当たり/ハズレ/大当たり/超大当たり/追撃）。`resolveTelopVariant` が結果に応じてファイルを選択。継続はランダム。
- **StorySequenceBuilder**: 管理 UI から動画 ID をクリック→順序リストに追加→JSON を Supabase に保存。ホバーでサムネ再生しつつ、シナリオを可視化できる。

---

## 8. 重要な設計判断・注意点

1. **V3 → V4 の本命プレイヤー切替**: `/app/gacha/[id]` (V3) を廃止し、`/gacha` から `GachaV4Player` を直接使う。旧 UI を触っても挙動が変わらないようにパス統一。
2. **telop をテキスト→画像へ移行**: テロップのデザイン品質を担保するため `ResultDisplay` を画像化。テキストレンダリング依存を無くし、粒子演出 + PNG のみで表現。
3. **Portal でフルスクリーン化**: ガラスカードの `backdrop-filter` が containing block になる問題を `createPortal` で解決。今後も全画面オーバーレイは body 直下に描画すること。
4. **`history_id` を `gacha_results` に追加**: 冪等なカード配布・再取得を可能にするため。結果 API は `history_id` を最優先し、なければ旧 `gacha_id` を参照する後方互換仕様。
5. **どんでん/追撃設定の正規化**: `donden_rate_settings` と `tsuigeki_settings` を分離し、★ごとに調整可能にした。RTP → どんでん → 追撃 → シナリオ → カード という順序で必ず処理する。
6. **カード在庫とシリアル**: `usage` マップで同一ガチャ内の一時使用数を追跡し、`current_supply + usage < max_supply` を満たすカードのみ選択。発番は `current_supply + used + 1`。
7. **動画差し替え容易性**: 動画 ID は `story_videos` にマスタ管理し、管理画面から `video_sequence` を JSON で編集。新プロジェクトでもキャラ追加に合わせて動画 ID を差し替えるだけで済む。
8. **安全なチケット処理**: チケット消費は Supabase `upsert`（`onConflict: user_id,ticket_type_id`）で原子的に更新。マルチガチャは RPC（`start_multi_gacha`）で在庫/チケット/結果挿入をまとめて制御し二重発行を防止。

---

## 9. 次ステップへの引き継ぎ

- このファイルを `sonshi_gacha_architecture.md` として添付し、新規プロジェクト `tensei-gacha` のナレッジに追加してください。
- STEP 3 では本設計を踏襲しつつ、キャラクター・シナリオ・カード世界観を「転生」テーマに置き換える方針で実装を進めます。
