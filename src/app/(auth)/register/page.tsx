import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="space-y-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.55em] text-neon-yellow">Register</p>
      <h1 className="font-display text-4xl">新規登録 (準備中)</h1>
      <p className="text-sm text-white/70">
        尊師ガチャと同様のメール登録フローは現在構築中です。完成まではログインページから「入場する」で体験できます。
      </p>
      <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-8 text-sm uppercase tracking-[0.35em] text-white/80">
        ログインへ戻る
      </Link>
    </div>
  );
}
