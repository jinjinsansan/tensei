import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="space-y-6 text-center text-library-text-primary">
      <p className="font-accent text-xs uppercase tracking-[0.45em] text-library-accent">Admission</p>
      <h1 className="font-serif text-3xl">入館証の発行</h1>
      <p className="text-sm text-library-text-secondary">
        正式な登録システムを準備中です。完成までは仮入館証で書庫を探索できます。
      </p>
      <Link href="/login" className="library-button secondary inline-flex justify-center">
        ログインへ戻る
      </Link>
    </div>
  );
}
