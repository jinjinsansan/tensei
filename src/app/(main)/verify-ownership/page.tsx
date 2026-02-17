import { VerifyOwnershipClient } from "@/components/verify-ownership/verify-ownership-client";

export const metadata = {
  title: "所有者検証 | 来世ガチャ",
  description: "カードのシリアルナンバーから実際の所有者を検証できます",
};

export default function VerifyOwnershipPage() {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      {/* ヘッダー */}
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">OWNERSHIP VERIFICATION</p>
        <h1 className="font-display text-3xl text-white">所有者検証データベース</h1>
        <p className="text-sm text-zinc-300">
          シリアルナンバーから実際のカード所有者を検証できます。画像は誰でも保存できますが、データベースに登録された所有者だけが本物です。
        </p>
      </div>

      <VerifyOwnershipClient />
    </section>
  );
}
