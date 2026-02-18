import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { fetchAuthedContext } from '@/lib/app/session';
import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchNotificationsForUser, markNotificationAsRead } from '@/lib/data/notifications';

async function markReadAction(formData: FormData) {
  'use server';
  const notificationId = String(formData.get('notificationId') ?? '');
  if (!notificationId) {
    return;
  }
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase);
  if (!context) {
    redirect('/login');
  }
  await markNotificationAsRead(supabase, context.user.id, notificationId);
  revalidatePath('/notifications');
}

export default async function NotificationsPage() {
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase);
  if (!context) {
    redirect('/login');
  }
  const notifications = await fetchNotificationsForUser(supabase, context.user.id, { limit: 50 });

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8 pb-10">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">INBOX</p>
        <h1 className="font-display text-4xl text-white">お知らせ受信箱</h1>
        <p className="text-sm text-zinc-300">管理者からのメルマガやフレンド通知がここに届きます。</p>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/60">
            まだ受信したお知らせはありません。
          </div>
        )}
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-3xl border px-6 py-5 shadow-panel-inset ${
              notification.read_at
                ? 'border-white/10 bg-black/30'
                : 'border-neon-yellow/40 bg-black/20'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">{notification.category}</p>
                <h2 className="text-xl font-semibold text-white">{notification.title}</h2>
              </div>
              {!notification.read_at && (
                <form action={markReadAction}>
                  <input type="hidden" name="notificationId" value={notification.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/80"
                  >
                    既読にする
                  </button>
                </form>
              )}
            </div>
            <p className="mt-3 text-sm text-white/80 whitespace-pre-line">{notification.message}</p>
            {notification.link_url && (
              <a
                href={notification.link_url}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-neon-yellow"
              >
                詳細を見る
                <span aria-hidden>→</span>
              </a>
            )}
            <p className="mt-2 text-xs text-white/40">
              {new Date(notification.created_at).toLocaleString('ja-JP')}
              {notification.emailed_at ? ' · メール送信済み' : ''}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
