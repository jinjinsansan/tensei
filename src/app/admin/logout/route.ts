import { redirect } from 'next/navigation';

import { clearSessionToken } from '@/lib/session/cookie';

export async function POST() {
  await clearSessionToken();
  redirect('/login-admin');
}
