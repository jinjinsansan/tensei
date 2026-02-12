import { redirect } from 'next/navigation';
import { SplashGateway } from '@/components/landing/splash-gateway';
import { getSessionToken } from '@/lib/session/cookie';
import { getServiceSupabase } from '@/lib/supabase/service';
import { findSessionByToken } from '@/lib/data/session';

export default async function LandingPage() {
  const token = await getSessionToken();
  if (token) {
    const supabase = getServiceSupabase();
    const session = await findSessionByToken(supabase, token);
    if (session) {
      redirect('/home');
    }
  }
  return <SplashGateway />;
}
