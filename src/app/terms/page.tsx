const sections = [
  {
    title: "第1条（適用）",
    body: [
      "本利用規約（以下「本規約」）は、来世ガチャ運営事務局（以下「当事務局」）が提供する『来世ガチャ』および関連サービス（以下「本サービス」）の利用条件を定めるものです。登録ユーザーおよびゲスト利用者は、本サービスを利用する際、本規約に同意したものとみなします。",
      "当事務局が本サービス上で随時掲載するガイドライン、ポリシー、個別規約等は、本規約の一部を構成します。",
    ],
  },
  {
    title: "第2条（アカウント）",
    body: [
      "ユーザーは、正確かつ最新の情報を入力し、自己の責任でアカウント情報を管理してください。未成年が利用する場合は、親権者等の同意を得たものとみなします。",
    ],
    bullets: [
      "アカウントの譲渡・貸与は禁止します。",
      "認証情報の漏えいが疑われる場合は速やかに当事務局へ連絡し、指示に従ってください。",
      "登録内容に変更が生じた場合は遅滞なく更新してください。",
    ],
  },
  {
    title: "第3条（チケットおよび決済）",
    body: [
      "本サービス内で取得できるチケット・ポイント等は、いずれも本サービス内でのみ有効なデジタルコンテンツであり、法定通貨としての価値はありません。",
      "有償チケットの価格、付与タイミング、利用可能期間等は、購入画面もしくは告知で定めます。購入後の払戻しは、法令に定めがある場合を除き行いません。",
    ],
  },
  {
    title: "第4条（禁止事項）",
    body: ["ユーザーは、以下の行為を行ってはなりません。"],
    bullets: [
      "法令または公序良俗に違反する行為",
      "虚偽情報の登録、他者へのなりすまし、マルチアカウントによる不正取得",
      "サービスの運営を妨げる行為、リバースエンジニアリング、過度なアクセス",
      "第三者の知的財産権・プライバシー・肖像権等を侵害する行為",
      "当事務局が不適切と判断する広告・勧誘・嫌がらせ行為",
    ],
  },
  {
    title: "第5条（サービスの提供・変更）",
    body: [
      "当事務局は、ユーザーへの事前通知なく、本サービスの全部または一部を変更・追加・停止することがあります。重大な変更を行う場合は、可能な限り事前に告知します。",
      "保守点検、システム障害、不可抗力等により提供を停止する場合があります。",
    ],
  },
  {
    title: "第6条（免責）",
    body: [
      "当事務局は、ユーザー間または第三者との間で生じたトラブルについて、一切の責任を負いません。ただし、当事務局の故意または重過失による場合はこの限りではありません。",
      "当事務局は、本サービスに関する瑕疵、エラー、障害がないことを保証しません。ユーザーが被った損害は、直接かつ通常の損害に限り、過去12か月間に当該ユーザーが当事務局に支払った利用料金を上限として賠償します。",
    ],
  },
  {
    title: "第7条（利用停止および契約解除）",
    body: [
      "ユーザーが本規約に違反した場合、当事務局は予告なくアカウント停止、チケット没収、利用契約の解除等を行うことができます。",
      "ユーザーは、所定の手続により任意に退会できます。退会後は取得済みのチケット等は失効します。",
    ],
  },
  {
    title: "第8条（準拠法・裁判管轄）",
    body: [
      "本規約の解釈には日本法を適用します。本サービスに関して当事務局とユーザーとの間で紛争が生じた場合、当事務局の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。",
    ],
  },
];

export const metadata = {
  title: "利用規約 | 来世ガチャ",
};

export default function TermsPage() {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-8 pb-16">
      <div className="rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">TERMS OF SERVICE</p>
        <h1 className="mt-2 font-display text-4xl text-white">利用規約</h1>
        <p className="mt-2 text-sm text-white/70">来世ガチャをご利用いただく際のルールとお願い事項をまとめています。</p>
        <p className="mt-2 text-xs text-white/50">最終更新日: 2026年2月19日</p>
      </div>

      <div className="space-y-5">
        {sections.map((section) => (
          <article
            key={section.title}
            className="space-y-3 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset"
          >
            <h2 className="font-display text-2xl text-white">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-white/75">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="list-inside list-disc space-y-1 text-sm text-white/70">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <p className="text-xs text-white/50">
        本規約は、ユーザーへの事前通知なく改定されることがあります。改定後に本サービスを利用した場合、改定後の本規約に同意したものとみなします。
      </p>
    </section>
  );
}
