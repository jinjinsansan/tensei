const sections = [
  {
    title: "1. 取得する情報",
    body: [
      "当事務局は、本サービスの提供に必要な範囲で以下の情報を取得します。",
    ],
    bullets: [
      "登録情報：氏名・ニックネーム・メールアドレス・SNSリンク等",
      "利用記録：ガチャ結果、チケット残高、ログイン日時、アクセスログ",
      "決済情報：決済サービスが発行するトークンやトランザクションID（クレジットカード番号は保持しません）",
      "サポート履歴：お問い合わせ内容、添付資料",
      "端末情報：ブラウザ種別、OS、Cookie、IPアドレス等",
    ],
  },
  {
    title: "2. 利用目的",
    body: [
      "取得した情報は、以下の目的で利用します。",
    ],
    bullets: [
      "本人確認および不正利用防止",
      "ガチャ結果やチケット残高の表示、ランキング等の提供",
      "お知らせ・キャンペーン情報・重要な変更の通知",
      "お問い合わせ対応、障害対応、品質向上のための分析",
      "法令遵守および権利保護のための記録保全",
    ],
  },
  {
    title: "3. 第三者提供・委託",
    body: [
      "当事務局は、以下の場合を除き、本人の同意なく個人情報を第三者に提供しません。",
    ],
    bullets: [
      "法令に基づく場合",
      "人の生命・身体・財産の保護に必要で本人同意取得が困難な場合",
      "公衆衛生の向上や児童の健全育成に必要で本人同意取得が困難な場合",
      "国の機関等への協力が必要な場合",
    ],
    tail: "サービス運営を委託する業務委託先（インフラ、決済、メール配信等）には、守秘義務契約を締結した上で必要最小限の範囲で情報を共有します。",
  },
  {
    title: "4. Cookie等の利用",
    body: [
      "本サービスでは、利便性向上やアクセス解析のためにCookieや同様の技術を利用します。ブラウザの設定で無効化できますが、機能が一部制限される場合があります。",
    ],
  },
  {
    title: "5. 情報の開示・訂正・削除",
    body: [
      "ユーザーは、登録内容の開示、訂正、利用停止、削除を希望する場合、本人確認ができる方法でお問い合わせください。合理的な範囲で速やかに対応します。ただし、法令に基づき保存義務がある情報は削除できない場合があります。",
    ],
  },
  {
    title: "6. 安全管理措置",
    body: [
      "当事務局は、アクセス権限の最小化、暗号化、監査ログの保全、外部委託先の管理等、適切な安全管理措置を講じます。",
    ],
  },
  {
    title: "7. プライバシーポリシーの変更",
    body: [
      "法令改正やサービス内容の変更に伴い、本ポリシーを改定する場合があります。重要な変更がある場合は、本サービス上で告知します。",
    ],
  },
  {
    title: "8. お問い合わせ窓口",
    body: [
      "個人情報の取り扱いに関するお問い合わせは、support@raisegacha.com 宛にお送りください。内容によっては回答にお時間をいただく場合があります。",
    ],
  },
];

export const metadata = {
  title: "プライバシーポリシー | 来世ガチャ",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-8 pb-16">
      <div className="rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">PRIVACY POLICY</p>
        <h1 className="mt-2 font-display text-4xl text-white">プライバシーポリシー</h1>
        <p className="mt-2 text-sm text-white/70">取得する情報、利用目的、安全管理体制を公開しています。</p>
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
            {section.tail && <p className="text-sm text-white/70">{section.tail}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
