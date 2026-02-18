"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getServiceSupabase } from '@/lib/supabase/service';
import { attachSessionToUser, detachSessionByToken } from '@/lib/data/session';
import { findUserByEmail, createUser, findUserById } from '@/lib/data/users';
import { ensureInitialTickets } from '@/lib/data/tickets';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { clearSessionToken, getOrCreateSessionToken, getSessionToken } from '@/lib/session/cookie';
import { deliverNotifications } from '@/lib/notifications/delivery';
import { getPublicEnv } from '@/lib/env';
import { createPasswordResetToken, verifyPasswordResetToken, markResetTokenUsed } from '@/lib/auth/reset';

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    displayName: z.string().min(1).optional(),
    acceptTerms: z.literal('true'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません。',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const resendSchema = z.object({
  email: z.string().email(),
});

const resetCompleteSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません。',
    path: ['confirmPassword'],
  });

const SITE_URL = getPublicEnv().NEXT_PUBLIC_SITE_URL ?? 'https://raisegacha.com';

function buildErrorRedirect(path: string, message: string) {
  const params = new URLSearchParams({ error: message });
  redirect(`${path}?${params.toString()}`);
}

function buildStatusRedirect(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params);
  redirect(`${path}?${search.toString()}`);
}

export async function registerLibraryMember(formData: FormData) {
  const supabase = getServiceSupabase();
  const parsed = registerSchema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
    displayName: formData.get('displayName') ? String(formData.get('displayName')) : undefined,
    acceptTerms: String(formData.get('acceptTerms') ?? ''),
  });
  if (!parsed.success) {
    buildErrorRedirect('/register', '入力内容をご確認ください。');
    return;
  }
  const { email, password } = parsed.data;
  const existing = await findUserByEmail(supabase, email);
  if (existing) {
    buildErrorRedirect('/register', '既に登録済みのメールアドレスです。');
    return;
  }
  const hashed = await hashPassword(password);
  const derivedDisplayName = parsed.data.displayName?.trim() || email.split('@')[0] || 'Player';
  const user = await createUser(supabase, {
    email,
    password_hash: hashed,
    display_name: derivedDisplayName,
  });
  await ensureInitialTickets(supabase, user.id);
  const token = await getOrCreateSessionToken();
  await attachSessionToUser(supabase, token, user.id);

  const cache = new Map([[user.id, user]]);
  await deliverNotifications(
    [
      {
        userId: user.id,
        title: 'ご登録ありがとうございます',
        message: '来世ガチャへようこそ！メニューから最新ガチャやチケット情報をチェックできます。',
        linkUrl: `${SITE_URL}/home`,
        category: 'system',
        emailSubject: '来世ガチャへようこそ',
      },
    ],
    { userCache: cache },
  );
  redirect('/home');
}

export async function loginLibraryMember(formData: FormData) {
  const supabase = getServiceSupabase();
  const parsed = loginSchema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  if (!parsed.success) {
    buildErrorRedirect('/login', 'メールアドレスまたはパスワードが正しくありません。');
    return;
  }
  const { email, password } = parsed.data;
  const user = await findUserByEmail(supabase, email);
  if (!user) {
    buildErrorRedirect('/login', 'メールアドレスまたはパスワードが正しくありません。');
    return;
  }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    buildErrorRedirect('/login', 'メールアドレスまたはパスワードが正しくありません。');
    return;
  }
  const token = await getOrCreateSessionToken();
  await attachSessionToUser(supabase, token, user.id);
  redirect('/home');
}

export async function exitNeonHall() {
  const supabase = getServiceSupabase();
  const token = await getSessionToken();
  if (token) {
    await detachSessionByToken(supabase, token);
  }
  await clearSessionToken();
  redirect('/');
}

export async function resendVerificationEmail(formData: FormData) {
  const supabase = getServiceSupabase();
  const parsed = resendSchema.safeParse({
    email: String(formData.get('email') ?? ''),
  });
  if (!parsed.success) {
    buildStatusRedirect('/login', { resend: 'invalid' });
    return;
  }
  const { email } = parsed.data;
  const user = await findUserByEmail(supabase, email);
  if (!user) {
    buildStatusRedirect('/login', { resend: 'missing' });
    return;
  }
  await deliverNotifications(
    [
      {
        userId: user.id,
        title: 'ログインリンクをお届けしました',
        message: 'ログインページからメールアドレスとパスワードでアクセスしてください。',
        linkUrl: `${SITE_URL}/login`,
        category: 'system',
        emailSubject: '来世ガチャへのログイン案内',
      },
    ],
    { userCache: new Map([[user.id, user]]) },
  );
  buildStatusRedirect('/login', { resend: 'sent' });
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = getServiceSupabase();
  const parsed = resendSchema.safeParse({
    email: String(formData.get('email') ?? ''),
  });
  if (!parsed.success) {
    buildStatusRedirect('/reset', { status: 'invalid' });
    return;
  }
  const user = await findUserByEmail(supabase, parsed.data.email);
  if (user) {
    const tokenRow = await createPasswordResetToken(supabase, user.id);
    const resetLink = `${SITE_URL}/reset?token=${tokenRow.token}`;
    await deliverNotifications(
      [
        {
          userId: user.id,
          title: 'パスワード再設定',
          message: `以下のリンクから1時間以内にパスワードを再設定してください。\n${resetLink}`,
          linkUrl: resetLink,
          category: 'system',
          emailSubject: 'パスワード再設定リンク',
        },
      ],
      { userCache: new Map([[user.id, user]]) },
    );
  }
  buildStatusRedirect('/reset', { status: 'sent' });
}

export async function completePasswordReset(formData: FormData) {
  const supabase = getServiceSupabase();
  const parsed = resetCompleteSchema.safeParse({
    token: String(formData.get('token') ?? ''),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  });
  if (!parsed.success) {
    buildStatusRedirect('/reset', { status: 'token-error' });
    return;
  }
  const tokenRow = await verifyPasswordResetToken(supabase, parsed.data.token);
  if (!tokenRow) {
    buildStatusRedirect('/reset', { status: 'token-expired' });
    return;
  }
  const user = await findUserById(supabase, tokenRow.user_id);
  if (!user) {
    buildStatusRedirect('/reset', { status: 'token-error' });
    return;
  }
  const newHash = await hashPassword(parsed.data.password);
  await supabase
    .from('app_users')
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq('id', user.id);
  await markResetTokenUsed(supabase, tokenRow.id);
  await deliverNotifications(
    [
      {
        userId: user.id,
        title: 'パスワードを更新しました',
        message: '新しいパスワードでログインできます。心当たりがない場合はサポートへご連絡ください。',
        linkUrl: `${SITE_URL}/login`,
        category: 'system',
        emailSubject: 'パスワードが更新されました',
      },
    ],
    { userCache: new Map([[user.id, user]]) },
  );
  buildStatusRedirect('/login', { reset: 'done' });
}
