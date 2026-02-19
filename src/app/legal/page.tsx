const entries = [
  { label: "販売事業者", value: "来世ガチャ運営事務局" },
  { label: "運営責任者", value: "Raise Gacha サポートチーム" },
  {
    label: "所在地",
    value: "特定商取引法第11条に基づき、購入希望者からの請求があった場合に遅滞なく開示します。",
  },
  {
    label: "連絡先",
    value: "support@raisegacha.com（受付時間: 平日10:00〜18:00）",
  },
  {
    label: "販売価格",
    value: "各商品ページに税込価格を表示します。デジタルコンテンツのため、配送に伴う追加料金は発生しません。",
  },
  {
    label: "商品代金以外の必要料金",
    value: "インターネット接続に要する通信料や端末費用はユーザーの負担となります。",
  },
  {
    label: "支払方法",
    value: "クレジットカード決済／デジタル決済（準備中）など、決済画面で案内する方法に限ります。",
  },
  {
    label: "支払時期",
    value: "各決済事業者の規約に基づき、購入手続き完了時に即時課金されます。",
  },
  {
    label: "引き渡し時期",
    value: "決済完了後ただちに、本サービス内でチケットまたはコンテンツを付与します。",
  },
  {
    label: "返品・キャンセル",
    value: "デジタルコンテンツの性質上、購入後のキャンセル・返金には対応しておりません。二重課金などの不具合が発生した場合はサポートまでご連絡ください。",
  },
  {
    label: "動作環境",
    value: "最新のブラウザおよび安定したネットワーク回線でのご利用を推奨します。",
  },
  {
    label: "電話番号",
    value: "電話番号の開示が必要な場合は、上記メールでご請求いただいたお客様へ個別に通知します。",
  },
];

export const metadata = {
  title: "特定商取引法に基づく表示 | 来世ガチャ",
};

export default function LegalPage() {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-8 pb-16">
      <div className="rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">LEGAL NOTICE</p>
        <h1 className="mt-2 font-display text-4xl text-white">特定商取引法に基づく表示</h1>
        <p className="mt-2 text-sm text-white/70">デジタルコンテンツ販売に関する取引条件を掲載しています。</p>
        <p className="mt-2 text-xs text-white/50">最終更新日: 2026年2月19日</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <dl className="divide-y divide-white/10">
          {entries.map((entry) => (
            <div key={entry.label} className="grid gap-3 py-4 sm:grid-cols-[160px_1fr]">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-neon-purple">{entry.label}</dt>
              <dd className="text-sm leading-relaxed text-white/80">{entry.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-xs text-white/50">
        表示内容に関するご不明点は、support@raisegacha.com までご連絡ください。
      </p>
    </section>
  );
}
