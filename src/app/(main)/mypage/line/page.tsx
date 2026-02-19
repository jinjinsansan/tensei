import Link from "next/link";

import { getServiceSupabase } from "@/lib/supabase/service";
import { getPublicEnv } from "@/lib/env";

const GLOBAL_CONFIG_ID = "00000000-0000-0000-0000-000000000001";

export const metadata = {
  title: "LINE特典 | 来世ガチャ",
};

async function fetchLineRewardPoints() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
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

export default async function LinePerkPage() {
  const [lineRewardPoints] = await Promise.all([fetchLineRewardPoints()]);
  const lineUrl = getPublicEnv().NEXT_PUBLIC_LINE_OFFICIAL_URL ?? "https://lin.ee/raisegacha";

  return (
    <section className="space-y-8 pb-12">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">LINE BONUS</p>
        <h1 className="font-display text-4xl text-white">公式LINE特典</h1>
        <p className="text-sm text-white/70">
          来世ガチャ公式LINEを友だち追加すると、特典としてNポイントが加算されます。
        </p>
        <p className="text-xs text-white/50">ポイント数は運営のキャンペーン内容に応じて変わる場合があります。</p>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">現在の付与ポイント</p>
            <p className="mt-2 text-sm text-white/70">友だち追加＋アンケート回答で受け取れるNポイント</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/30 bg-emerald-400/10 px-6 py-3 text-center">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-emerald-200">Bonus</p>
            <p className="text-4xl font-display text-emerald-200">{lineRewardPoints.toLocaleString("ja-JP")}</p>
            <p className="text-xs text-emerald-100/80">Nポイント</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={lineUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-2xl border border-white/15 bg-gradient-to-r from-[#06c755] to-[#00a64f] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_20px_45px_rgba(0,0,0,0.35)] transition hover:scale-[1.01]"
          >
            公式LINEを追加する
          </a>
          <Link
            href="/mypage"
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            メニューに戻る
          </Link>
        </div>
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
            <p className="font-semibold text-white">① 公式LINEを友だち追加</p>
            <p className="text-white/70">上記のボタンからLINEアプリを開き、「友だち追加」を完了させます。</p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="font-semibold text-white">② ウェルカムメッセージ内のフォームに回答</p>
            <p className="text-white/70">ニックネームと来世ガチャ登録メールアドレスを入力し、送信してください。</p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="font-semibold text-white">③ 運営が確認後、Nポイント付与</p>
            <p className="text-white/70">通常24時間以内に付与されます。付与完了時はお知らせに通知が届きます。</p>
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
            <p className="text-white/70">フォーム送信後、運営が内容を確認してから順次付与します。目安は24時間以内です。</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="font-semibold text-white">過去に一度追加したことがあります。再度もらえますか？</p>
            <p className="text-white/70">原則として1アカウントにつき1回のみです。キャンペーンで再付与がある場合はこのページで告知します。</p>
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
