import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { fetchAuthedContext } from '@/lib/app/session';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getPublicEnv } from '@/lib/env';
import {
  fetchReferralStats,
  getReferralSettings,
  createReferralCodeForUser,
} from '@/lib/data/referrals';
import { ReferralCopyButton } from '@/components/referral/referral-copy-button';
import type { Tables } from '@/types/database';

async function createReferralLinkAction() {
  'use server';
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase);
  if (!context) {
    redirect('/login');
  }
  await createReferralCodeForUser(supabase, context.user.id);
  revalidatePath('/referrals');
}

export default async function ReferralPage() {
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase);
  if (!context) {
    redirect('/login');
  }
  const [settings, stats, friendRows] = await Promise.all([
    getReferralSettings(supabase),
    fetchReferralStats(supabase, context.user.id),
    supabase
      .from('friends')
      .select(
        'id, user_id, friend_user_id, created_at, friend:friend_user_id!friends_friend_user_id_fkey ( display_name, email )',
      )
      .eq('user_id', context.user.id)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);
  if (friendRows.error) {
    throw new Error(friendRows.error.message);
  }
  type FriendRow = Pick<Tables<'friends'>, 'id' | 'user_id' | 'friend_user_id' | 'created_at'> & {
    friend?: Pick<Tables<'app_users'>, 'display_name' | 'email'> | null;
  };
  const friendList = ((friendRows.data ?? []) as FriendRow[]).map((row) => ({
    id: row.friend_user_id,
    name: row.friend?.display_name ?? '名無しさん',
    email: row.friend?.email ?? null,
    createdAt: row.created_at,
  }));
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL ?? 'https://raisegacha.com';
  const referralUrl = stats.code ? `${siteUrl}/register?ref=${stats.code}` : null;
  const referralDisabled = context.user.referral_blocked;

  return (
    <section className="space-y-8 pb-10">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">REFERRAL</p>
        <h1 className="font-display text-3xl text-white">友だち紹介プログラム</h1>
        <p className="text-sm text-zinc-300">紹介URLをシェアして、あなたとお友だち双方にチケットをプレゼント。</p>
      </div>

      <div className="space-y-5 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Referral Link</p>
            {referralUrl ? (
              <p className="text-sm text-white/80">{referralUrl}</p>
            ) : (
              <p className="text-sm text-white/60">紹介URLを作成するとここに表示されます。</p>
            )}
          </div>
          {referralUrl && !referralDisabled && <ReferralCopyButton value={referralUrl} />}
        </div>
        {referralDisabled ? (
          <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            不正利用の可能性により、紹介機能が停止されています。サポートまでお問い合わせください。
          </p>
        ) : (
          <form action={createReferralLinkAction}>
            <button
              type="submit"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed"
              disabled={Boolean(referralUrl)}
            >
              {referralUrl ? '紹介URLが発行済みです' : '紹介URLを作成する'}
            </button>
          </form>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">紹介成立数</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.totalInvites}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">累計獲得チケット</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.totalTicketsEarned}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-pink text-lg font-bold text-white">
            1
          </div>
          <h2 className="font-display text-2xl text-white">紹介の流れ</h2>
        </div>
        <ol className="space-y-4 text-sm text-white/80">
          <li className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="font-semibold text-white">① 紹介URLを友だちにシェア</p>
            <p className="text-white/70">LINEやSNSでリンクを送ってください。紹介者名は自動で紐づきます。</p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="font-semibold text-white">② 友だちが登録</p>
            <p className="text-white/70">/register?ref=コード を経由すると紹介が成立します。</p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="font-semibold text-white">③ 両方にチケット付与</p>
            <p className="text-white/70">紹介された瞬間に自動付与。さらにお互いのフレンド欄へ登録されます。</p>
          </li>
        </ol>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-blue text-lg font-bold text-white">
            2
          </div>
          <h2 className="font-display text-2xl text-white">ポイント（チケット）付与内容</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">紹介者</p>
            <p className="mt-2 text-4xl font-bold text-neon-pink">{settings.referrer_ticket_amount}</p>
            <p className="text-sm text-white/70">ベーシックチケットが自動で付与されます。</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">紹介された友だち</p>
            <p className="mt-2 text-4xl font-bold text-neon-blue">{settings.referee_ticket_amount}</p>
            <p className="text-sm text-white/70">登録直後に同じ枚数のチケットを受け取ります。</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-yellow text-lg font-bold text-black">
            3
          </div>
          <h2 className="font-display text-2xl text-white">紹介履歴</h2>
        </div>
        {stats.recentInvites.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/60">
            まだ紹介履歴はありません。
          </p>
        ) : (
          <ul className="space-y-3">
            {stats.recentInvites.map((invite) => (
              <li key={invite.userId} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                <div className="flex flex-col gap-1 text-sm text-white/80">
                  <p className="font-semibold text-white">{invite.name}</p>
                  <p className="text-xs text-white/60">{invite.email ?? 'メールアドレス非公開'}</p>
                  <p className="text-xs text-white/50">
                    {new Date(invite.createdAt).toLocaleString('ja-JP')} / +{invite.tickets} 枚
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
            F
          </div>
          <h2 className="font-display text-2xl text-white">フレンド一覧</h2>
        </div>
        {friendList.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/60">
            まだフレンドがいません。紹介経由で登録すると自動でフレンドになります。
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {friendList.map((friend) => (
              <li key={friend.id} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                <p className="text-sm font-semibold text-white">{friend.name}</p>
                <p className="text-xs text-white/60">{friend.email ?? 'メール非公開'}</p>
                <p className="text-xs text-white/40">{new Date(friend.createdAt).toLocaleDateString('ja-JP')}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href="/mypage"
        className="block rounded-full border border-white/20 bg-black/30 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-neon-yellow"
      >
        ← メニューに戻る
      </Link>
    </section>
  );
}
