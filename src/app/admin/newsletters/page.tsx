import { redirect } from 'next/navigation';

import { AdminCard, AdminPageHero } from '@/components/admin/admin-ui';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { fetchMailBroadcastHistory } from '@/lib/data/notifications';
import { deliverNotifications } from '@/lib/notifications/delivery';
import { getPublicEnv } from '@/lib/env';
import type { Tables } from '@/types/database';

async function sendNewsletter(formData: FormData) {
  'use server';
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const audience = String(formData.get('audience') ?? 'all');
  const targetEmailRaw = String(formData.get('targetEmail') ?? '').trim();

  if (!subject || !body) {
    redirect('/admin/newsletters?error=missing_fields');
  }

  if (audience === 'individual' && !targetEmailRaw) {
    redirect('/admin/newsletters?error=missing_target');
  }

  const supabase = getServiceSupabase();
  const adminUser = await getUserFromSession(supabase);
  if (!adminUser || !adminUser.is_admin) {
    redirect('/login-admin');
  }

  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();
  const linkUrl = `${NEXT_PUBLIC_SITE_URL ?? 'https://raisegacha.com'}/notifications`;

  type AppUser = Tables<'app_users'>;
  let recipients: AppUser[] = [];
  if (audience === 'all') {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('is_blocked', false)
      .is('deleted_at', null);
    if (error) {
      redirect('/admin/newsletters?error=recipients');
    }
    recipients = (data ?? []) as AppUser[];
  } else {
    const targetEmail = targetEmailRaw.toLowerCase();
    const { data, error } = await supabase.from('app_users').select('*').eq('email', targetEmail).maybeSingle();
    if (error || !data) {
      redirect('/admin/newsletters?error=unknown_target');
    }
    recipients = [data as AppUser];
  }

  if (!recipients?.length) {
    redirect('/admin/newsletters?error=no_recipients');
  }

  const plainBody = body;
  const bodyHtml = body
    .split('\n')
    .map((line) => line || '&nbsp;')
    .join('<br />');

  const { data: broadcastRow, error: broadcastError } = await supabase
    .from('mail_broadcasts')
    .insert({
      subject,
      body_html: bodyHtml,
      body_text: plainBody,
      audience,
      target_user_id: audience === 'individual' ? recipients[0].id : null,
      sent_by: adminUser.id,
      total_recipients: recipients.length,
      status: 'sending',
    })
    .select('*')
    .single();

  if (broadcastError || !broadcastRow) {
    redirect('/admin/newsletters?error=broadcast_create');
  }

  const userCache = new Map<string, AppUser>();
  for (const user of recipients) {
    userCache.set(user.id, user);
  }

  const payloads = recipients.map((user) => ({
    userId: user.id,
    title: subject,
    message: plainBody,
    linkUrl,
    category: 'newsletter' as const,
    emailSubject: subject,
    emailPreview: plainBody.slice(0, 140),
    broadcastId: broadcastRow.id,
    tags: [{ name: 'broadcast_id', value: broadcastRow.id }],
  }));

  const results = await deliverNotifications(payloads, { userCache });

  const logsPayload = results.map((result, index) => ({
    broadcast_id: broadcastRow.id,
    user_id: payloads[index]?.userId ?? null,
    email: recipients[index]?.email ?? '',
    status: result.emailStatus,
    sent_at: result.emailStatus === 'sent' ? new Date().toISOString() : null,
    error_message: result.error ?? null,
  }));
  if (logsPayload.length) {
    await supabase.from('mail_broadcast_logs').insert(logsPayload);
  }

  const hasFailure = results.some((result) => result.emailStatus === 'failed');
  await supabase
    .from('mail_broadcasts')
    .update({
      status: hasFailure ? 'failed' : 'sent',
      error_message: hasFailure ? '一部のメール配信に失敗しました。' : null,
      sent_at: new Date().toISOString(),
    })
    .eq('id', broadcastRow.id);

  redirect(hasFailure ? '/admin/newsletters?error=partial' : '/admin/newsletters?success=1');
}

type NewsletterPageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function NewsletterPage({ searchParams }: NewsletterPageProps) {
  const params = await searchParams;
  const supabase = getServiceSupabase();
  const history = await fetchMailBroadcastHistory(supabase, { limit: 10 });

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Mailer"
        title="メルマガ配信"
        description="全体または個別ユーザーにメールとアプリ内お知らせを即時送信します。"
      />

      {params?.success && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          ✅ メルマガを送信しました。
        </div>
      )}
      {params?.error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">
          ❌ メルマガ送信に失敗しました。（{params.error}）
        </div>
      )}

      <AdminCard>
        <form action={sendNewsletter} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">件名</label>
            <input
              type="text"
              name="subject"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">本文</label>
            <textarea
              name="body"
              required
              rows={8}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white"
              placeholder="配信内容を入力してください"
            />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white">
            <label className="flex items-center gap-2">
              <input type="radio" name="audience" value="all" defaultChecked className="h-4 w-4" />
              全ユーザーに配信
            </label>
            <label className="flex flex-col gap-2">
              <span className="flex items-center gap-2">
                <input type="radio" name="audience" value="individual" className="h-4 w-4" />
                特定ユーザーにのみ配信
              </span>
              <input
                type="email"
                name="targetEmail"
                placeholder="ユーザーのメールアドレス"
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white"
              />
            </label>
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl border border-neon-yellow/30 bg-gradient-to-r from-neon-yellow/30 to-neon-pink/30 px-4 py-3 font-semibold text-white transition hover:opacity-90"
          >
            メルマガを送信
          </button>
        </form>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-semibold text-white">配信履歴</h2>
        <div className="mt-4 space-y-3">
          {history.length === 0 && <p className="text-sm text-white/60">まだ配信履歴がありません。</p>}
          {history.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/50">{entry.audience === 'all' ? '全体' : '個別'}</p>
                  <p className="text-lg font-semibold text-white">{entry.subject}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.3em] ${
                    entry.status === 'sent'
                      ? 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                      : entry.status === 'sending'
                        ? 'border border-yellow-400/40 bg-yellow-400/10 text-yellow-200'
                        : 'border border-red-400/40 bg-red-400/10 text-red-200'
                  }`}
                >
                  {entry.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/70">{entry.body_text.slice(0, 120)}...</p>
              <p className="mt-2 text-xs text-white/40">
                {entry.total_recipients} recipients / {entry.sent_at ? new Date(entry.sent_at).toLocaleString('ja-JP') : '未送信'}
              </p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
