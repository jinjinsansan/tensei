"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getServiceSupabase } from '@/lib/supabase/service';
import { attachSessionToUser } from '@/lib/data/session';
import { findUserByEmail } from '@/lib/data/users';
import { verifyPassword } from '@/lib/auth/password';
import { getOrCreateSessionToken } from '@/lib/session/cookie';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function buildErrorRedirect(message: string) {
  const params = new URLSearchParams({ error: message });
  redirect(`/login-admin?${params.toString()}`);
}

export async function loginAsAdmin(formData: FormData) {
  const supabase = getServiceSupabase();
  
  const parsed = loginSchema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });

  if (!parsed.success) {
    buildErrorRedirect('メールアドレスまたはパスワードが正しくありません。');
    return;
  }

  const { email, password } = parsed.data;
  
  const user = await findUserByEmail(supabase, email);
  if (!user) {
    buildErrorRedirect('メールアドレスまたはパスワードが正しくありません。');
    return;
  }

  // Check if user is admin
  if (!user.is_admin) {
    buildErrorRedirect('管理者権限がありません。');
    return;
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    buildErrorRedirect('メールアドレスまたはパスワードが正しくありません。');
    return;
  }

  const token = await getOrCreateSessionToken();
  await attachSessionToUser(supabase, token, user.id);
  
  redirect('/admin');
}
