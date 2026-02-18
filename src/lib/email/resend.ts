import { Resend } from 'resend';

import { getServerEnv } from '@/lib/env';

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
};

export type NotificationEmailOptions = {
  title: string;
  body: string;
  linkUrl?: string;
  previewText?: string;
  footer?: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendClient) {
    const { RESEND_API_KEY } = getServerEnv();
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

function fallbackTextFromHtml(html: string) {
  return html
    .replace(/<br\s*\/?>(\s?)/gi, '\n')
    .replace(/<\/?p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
}

export async function sendTransactionalEmail(options: SendEmailOptions) {
  const client = getResendClient();
  const { RESEND_FROM_EMAIL, RESEND_FROM_NAME } = getServerEnv();
  const from = `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`;
  const result = await client.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text ?? fallbackTextFromHtml(options.html),
    tags: options.tags,
  });
  return result;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderNotificationEmail(options: NotificationEmailOptions): { html: string; text: string } {
  const bodyHtml = options.body
    .split(/\n{2,}/)
    .map((block) =>
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#0f172a;">${escapeHtml(block).replace(/\n/g, '<br />')}</p>`,
    )
    .join('');

  const linkSection = options.linkUrl
    ? `
    <a href="${options.linkUrl}" style="display:inline-block;margin-top:16px;padding:12px 18px;border-radius:999px;background:#111827;color:#f8fafc;font-weight:600;text-decoration:none;">来世ガチャを開く</a>
  `
    : '';

  const footer = options.footer ?? 'このメールは来世ガチャからの自動配信です。';

  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    </head>
    <body style="background-color:#0b0d16;margin:0;padding:24px;font-family:'Helvetica Neue',Arial,'Hiragino Kaku Gothic ProN',sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#f8fafc;border-radius:24px;padding:32px;">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.2em;color:#0ea5e9;text-transform:uppercase;">RAISE GACHA</p>
                  <h1 style="margin:0 0 24px;font-size:22px;color:#020617;">${escapeHtml(options.title)}</h1>
                  ${bodyHtml}
                  ${linkSection}
                  <p style="margin:24px 0 0;font-size:12px;color:#475569;">${escapeHtml(footer)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  const text = `${options.title}\n\n${options.body}${options.linkUrl ? `\n\n${options.linkUrl}` : ''}`.trim();
  return { html, text };
}
