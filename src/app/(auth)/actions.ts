"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getServiceSupabase } from '@/lib/supabase/service';
import { attachSessionToUser, detachSessionByToken } from '@/lib/data/session';
import { findUserByEmail, createUser } from '@/lib/data/users';
import { ensureInitialTickets } from '@/lib/data/tickets';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { clearSessionToken, getOrCreateSessionToken, getSessionToken } from '@/lib/session/cookie';

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
  redirect('/login');
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
  buildStatusRedirect('/login', { resend: 'sent' });
}
