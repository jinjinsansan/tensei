import Image from 'next/image';
import Link from 'next/link';

export function HowToPlayScreen() {
  return (
    <section className="space-y-8 pb-8">
      {/* ヘッダー */}
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">HOW TO PLAY</p>
        <h1 className="font-display text-3xl text-white">使い方ガイド</h1>
        <p className="text-sm text-zinc-300">来世ガチャの遊び方を説明します</p>
      </div>

      {/* ① チケットをGETしよう */}
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-pink text-lg font-bold text-white">
            1
          </div>
          <h2 className="font-display text-2xl text-white">チケットをGETしよう</h2>
        </div>
        
        <p className="text-sm leading-relaxed text-zinc-300">
          毎日ログインするだけでGETできるフリーチケットや購入できるチケットがたくさん！
          素敵な来世になるためにたくさんチケットを準備しよう
        </p>

        {/* チケットデザイン表示 */}
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🎫</div>
              <div>
                <p className="font-display text-lg text-emerald-300">フリーチケット</p>
                <p className="text-xs text-zinc-400">毎日ログインでGET！</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-neon-blue/30 bg-gradient-to-br from-blue-950/40 to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">💎</div>
              <div>
                <p className="font-display text-lg text-neon-blue">プレミアムチケット</p>
                <p className="text-xs text-zinc-400">購入で入手可能</p>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/home"
          className="mt-4 block rounded-full border border-neon-pink bg-neon-pink/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-neon-pink/20"
        >
          チケットページへ →
        </Link>
      </div>

      {/* ② ガチャを回そう */}
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-blue text-lg font-bold text-white">
            2
          </div>
          <h2 className="font-display text-2xl text-white">ガチャを回そう</h2>
        </div>
        
        <p className="text-sm leading-relaxed text-zinc-300">
          「ガチャを始める」をクリックすると自動でガチャが始まるよ。
          １つ１つのシーンの度にNEXTボタンをクリックすると次のシーンが出ます。
          SKIPを押すと全てのシーンが飛ばされ結果が表示されるよ。
        </p>

        {/* 健太編の画像 */}
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-950/40 to-transparent p-4">
            <p className="mb-3 font-display text-lg text-orange-300">健太編</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/kenta_cards/card01_convenience.png"
                  alt="健太カード1"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/kenta_cards/card06_boxer.png"
                  alt="健太カード2"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/kenta_cards/card12_hero.png"
                  alt="健太カード3"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 昭一編の画像 */}
          <div className="rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-950/40 to-transparent p-4">
            <p className="mb-3 font-display text-lg text-purple-300">昭一編</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/shoichi_cards/shoichi_card01_fish.png"
                  alt="昭一カード1"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/shoichi_cards/shoichi_card06_ikemen.png"
                  alt="昭一カード2"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/shoichi_cards/shoichi_card12_investor.png"
                  alt="昭一カード3"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/gacha"
          className="mt-4 block rounded-full border border-neon-blue bg-neon-blue/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-neon-blue/20"
        >
          ガチャページへ →
        </Link>
      </div>

      {/* ③ カウントダウンはドキドキタイム */}
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-yellow text-lg font-bold text-black">
            3
          </div>
          <h2 className="font-display text-2xl text-white">カウントダウンはドキドキタイム</h2>
        </div>
        
        <p className="text-sm leading-relaxed text-zinc-300">
          １つずつ数字が出るカウントダウンタイムはドキドキ時間です。
          カウントダウンが終わって「プチュン♪」が鳴れば<span className="font-bold text-neon-yellow">当たり確定</span>だよ！
        </p>

        {/* カウントダウン演出のイメージ */}
        <div className="mt-6 rounded-2xl border border-neon-yellow/30 bg-gradient-to-br from-yellow-950/40 to-transparent p-6">
          <div className="flex items-center justify-center gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-400 bg-green-950/50 text-2xl font-bold text-green-300">
                4
              </div>
              <p className="text-xs text-zinc-400">緑</p>
            </div>
            <div className="text-2xl text-zinc-600">→</div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-400 bg-blue-950/50 text-2xl font-bold text-blue-300">
                3
              </div>
              <p className="text-xs text-zinc-400">青</p>
            </div>
            <div className="text-2xl text-zinc-600">→</div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-400 bg-red-950/50 text-2xl font-bold text-red-300">
                2
              </div>
              <p className="text-xs text-zinc-400">赤</p>
            </div>
            <div className="text-2xl text-zinc-600">→</div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-pink bg-pink-950/50 text-2xl font-bold text-neon-pink">
                1
              </div>
              <p className="text-xs text-zinc-400">虹</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xl font-bold text-neon-yellow">プチュン♪</p>
            <p className="mt-2 text-sm text-zinc-400">この音が聞こえたら当たり確定！</p>
          </div>
        </div>
      </div>

      {/* ④ 来世ガチャのキャラクターは全部で7人 */}
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink to-neon-blue text-lg font-bold text-white">
            4
          </div>
          <h2 className="font-display text-2xl text-white">来世ガチャのキャラクター</h2>
        </div>
        
        <p className="text-sm leading-relaxed text-zinc-300">
          来世ガチャのキャラクターは全部で7人。
          みんなそれぞれ素敵な来世を願っています。
          みんなで応援しよう！
        </p>

        {/* 現在実装済みのキャラクター */}
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-950/40 to-transparent p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-2xl font-bold text-white">
                健
              </div>
              <div className="flex-1">
                <p className="font-display text-xl text-orange-300">健太</p>
                <p className="text-xs text-zinc-400">21歳の大学生。様々な来世が待っている</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-950/40 to-transparent p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-2xl font-bold text-white">
                昭
              </div>
              <div className="flex-1">
                <p className="font-display text-xl text-purple-300">昭一</p>
                <p className="text-xs text-zinc-400">50歳のサラリーマン。第二の人生を夢見て</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-600/30 bg-gradient-to-br from-zinc-800/40 to-transparent p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-xl text-zinc-400">
                ?
              </div>
              <div className="flex-1">
                <p className="font-display text-xl text-zinc-400">さらに5人のキャラクター</p>
                <p className="text-xs text-zinc-500">近日公開予定！お楽しみに</p>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/collection"
          className="mt-4 block rounded-full border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
        >
          コレクションを見る →
        </Link>
      </div>

      {/* 戻るボタン */}
      <Link
        href="/mypage"
        className="block rounded-full border border-white/20 bg-black/30 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-neon-pink"
      >
        ← メニューに戻る
      </Link>
    </section>
  );
}
