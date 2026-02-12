"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getServiceSupabase } from '@/lib/supabase/service';
import { attachSessionToUser, findSessionByToken, updateSession } from '@/lib/data/session';
import { findUserByEmail, createUser, touchLastLogin } from '@/lib/data/users';
import { ensureInitialTickets } from '@/lib/data/tickets';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { clearSessionToken, getOrCreateSessionToken, getSessionToken } from '@/lib/session/cookie';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function buildErrorRedirect(path: string, message: string) {
  const params = new URLSearchParams({ error: message });
  redirect(`${path}?${params.toString()}`);
}

export async function registerLibraryMember(formData: FormData) {
  const supabase = getServiceSupabase();
  const parsed = registerSchema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    displayName: String(formData.get('displayName') ?? ''),
  });
  if (!parsed.success) {
    buildErrorRedirect('/register', '入力内容をご確認ください。');
    return;
  }
  const { email, password, displayName } = parsed.data;
  const existing = await findUserByEmail(supabase, email);
  if (existing) {
    buildErrorRedirect('/register', '既に登録済みのメールアドレスです。');
    return;
  }
  const hashed = await hashPassword(password);
  const user = await createUser(supabase, {
    email,
    password_hash: hashed,
    display_name: displayName.trim(),
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
  await touchLastLogin(supabase, user.id);
  const token = await getOrCreateSessionToken();
  await attachSessionToUser(supabase, token, user.id);
  redirect('/home');
}

export async function exitNeonHall() {
  const supabase = getServiceSupabase();
  const token = await getSessionToken();
  if (token) {
    const session = await findSessionByToken(supabase, token);
    if (session) {
      await updateSession(supabase, session.id, { app_user_id: null });
    }
  }
  await clearSessionToken();
  redirect('/login');
}
