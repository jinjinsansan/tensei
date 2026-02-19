import { Fragment } from 'react';
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

          {/* 正一編の画像 */}
          <div className="rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-950/40 to-transparent p-4">
            <p className="mb-3 font-display text-lg text-purple-300">正一編</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/shoichi_cards/shoichi_card02_train.png"
                  alt="正一カード 満員電車"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover object-center"
                  style={{ objectPosition: 'center' }}
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/shoichi_cards/shoichi_card06_ikemen.png"
                  alt="正一カード2"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/shoichi_cards/shoichi_card12_investor.png"
                  alt="正一カード3"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 辰巳編の画像 */}
          <div className="rounded-2xl border border-red-400/30 bg-gradient-to-br from-red-950/40 to-transparent p-4">
            <p className="mb-3 font-display text-lg text-red-300">辰巳編</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/tatumi_cards/tatumi_card01.png"
                  alt="辰巳カード 石ころ転生"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/tatumi_cards/tatumi_card06.png"
                  alt="辰巳カード 閻魔大王転生"
                  width={120}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src="/tatumi_cards/tatumi_card12.png"
                  alt="辰巳カード 閻魔大王（真）転生"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-yellow text-lg font-bold text-white">
            3
          </div>
          <h2 className="font-display text-2xl text-white">カウントダウンはドキドキタイム</h2>
        </div>
        
        <p className="text-sm leading-relaxed text-zinc-300">
          １つずつ数字が出るカウントダウンタイムはドキドキ時間です。
          カウントダウンが終わって「プチュン♪」が鳴れば<span className="font-bold text-neon-yellow">当たり確定</span>だよ！
        </p>

        {/* カウントダウン演出のイメージ */}
        <div className="mt-6 space-y-6 rounded-2xl border border-neon-yellow/30 bg-gradient-to-br from-yellow-950/40 to-transparent p-6">
          <div className="flex flex-col items-stretch gap-5 lg:flex-row lg:items-center">
            {[{
              number: '4',
              label: '緑スタート',
              color: 'green',
              src: '/images/countdown/cd_green_916_1.png',
            }, {
              number: '3',
              label: '青で加速',
              color: 'blue',
              src: '/images/countdown/cd_blue_916_4.png',
            }, {
              number: '2',
              label: '赤で激アツ',
              color: 'red',
              src: '/images/countdown/cd_red_916_6.png',
            }, {
              number: '1',
              label: '虹で確定級',
              color: 'rainbow',
              src: '/images/countdown/cd_rainbow_916_8.png',
            }].map((step, index, arr) => (
              <Fragment key={step.number}>
                <div className="flex flex-1 flex-col items-center gap-3 text-center">
                  <div className="w-full overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
                    <div className="relative mx-auto h-48 w-full max-w-[220px]">
                      <Image
                        src={step.src}
                        alt={`カウントダウン${step.number}`}
                        fill
                        sizes="220px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.5em] text-zinc-500">STEP {step.number}</p>
                    <p className="text-sm font-semibold text-white">{step.label}</p>
                  </div>
                </div>
                {index < arr.length - 1 ? (
                  <div className="flex items-center justify-center text-xl text-zinc-500 lg:text-2xl" aria-hidden="true">
                    <span className="lg:hidden">↓</span>
                    <span className="hidden lg:inline">→</span>
                  </div>
                ) : null}
              </Fragment>
            ))}
          </div>

          <div className="text-center">
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
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-orange-300 bg-black/40 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                <Image
                  src="/kenta_cards/card01_convenience.png"
                  alt="健太のアイコン"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-display text-xl text-orange-300">健太</p>
                <p className="text-xs leading-relaxed text-zinc-400">
                  22歳大学生、コンビニエンスストアの深夜バイトの毎日。来月の家賃も厳しい日々の暮らしにある日転生チャンスが訪れる。
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-950/40 to-transparent p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-purple-300 bg-black/40 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                <Image
                  src="/shoichi_cards/shoichi_card06_ikemen.png"
                  alt="正一のアイコン"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-display text-xl text-purple-300">正一</p>
                <p className="text-xs leading-relaxed text-zinc-400">
                  58歳　冴えないサラリーマン。チビハゲデブ独身の4重苦の人生。もう何もかも諦めかけていた時に転生チャンスが訪れる。
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-400/30 bg-gradient-to-br from-red-950/40 to-transparent p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-red-300 bg-black/40 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                <Image
                  src="/tatumi_cards/tatumi_card05.png"
                  alt="辰巳剛のアイコン"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-display text-xl text-red-300">辰巳剛</p>
                <p className="text-xs leading-relaxed text-zinc-400">
                  45歳・元任侠の男。組の解散後も孤独に生きてきたが、義理人情を胸に再出発を願う。新たな来世で仲間と家族を取り戻せるのか？
                </p>
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
