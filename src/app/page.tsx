import Link from "next/link";

import { GachaExperience } from "@/components/gacha/gacha-experience";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black font-sans text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12">
        <header className="space-y-4 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">Tensei Gacha</p>
          <h1 className="text-4xl font-bold leading-tight">
            転生ガチャ 〜来世ルーレット〜
          </h1>
          <p className="text-base text-slate-300">
            ガチャを回して健太の来世を見届けましょう。動画で物語が進み、どんでん返しが起きればレア度が一気に跳ね上がります。
          </p>
          <Link href="/collection" className="inline-flex items-center text-sm text-emerald-200 underline">
            カード図鑑を見る
          </Link>
        </header>
        <GachaExperience />
      </div>
    </div>
  );
}
