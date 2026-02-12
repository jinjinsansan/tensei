import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { TabBar, type TabBarItem } from '@/components/layout/tab-bar';
import { MainAppProvider } from '@/components/providers/main-app-provider';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getOrCreateSession } from '@/lib/data/session';
import { getOrCreateSessionToken } from '@/lib/session/cookie';
import { loadMainAppSnapshot } from '@/lib/app/main-app';

const tabs: TabBarItem[] = [
  { label: 'TICKET', href: '/home', icon: 'ticket' },
  { label: 'CARD', href: '/collection', icon: 'collection' },
  { label: 'GACHA', href: '/gacha', icon: 'gacha', primary: true },
  { label: 'SOCIAL', href: '/social', icon: 'social' },
  { label: 'MENU', href: '/menu', icon: 'menu' },
];

type MainLayoutProps = {
  children: ReactNode;
};

export default async function MainLayout({ children }: MainLayoutProps) {
  const token = await getOrCreateSessionToken();
  const supabase = getServiceSupabase();
  const session = await getOrCreateSession(supabase, token);
  const snapshot = loadMainAppSnapshot(session);

  return (
    <div className="fixed inset-0 bg-hall-background text-white">
      <Toaster position="top-center" theme="dark" richColors />
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-hall-grid opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff2d95_0%,transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#30f0ff_0%,transparent_55%)]" />
      </div>

      <MainAppProvider initialSnapshot={snapshot}>
        <div
          className="relative h-full overflow-y-auto overflow-x-hidden"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-5xl justify-center px-0 pb-24 pt-4 sm:px-4 sm:pb-32 sm:pt-8">
            <div className="relative flex w-full flex-col rounded-none border-none bg-transparent px-4 pb-24 pt-8 sm:max-w-[430px] sm:rounded-[2.5rem] sm:border sm:border-white/12 sm:bg-[rgba(6,2,16,0.92)] sm:px-5 sm:pb-24 sm:pt-10 sm:shadow-[0_35px_120px_rgba(0,0,0,0.75)] sm:ring-1 sm:ring-white/5">
              <div className="pointer-events-none absolute inset-0 hidden rounded-[2.5rem] shadow-[inset_0_0_35px_rgba(48,240,255,0.08)] sm:block" />
              <div className="pointer-events-none absolute left-1/2 top-4 hidden h-6 w-40 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 blur-[1px] sm:block" />
              <div className="relative flex-1">{children}</div>
            </div>
          </div>
        </div>
      </MainAppProvider>

      <TabBar items={tabs} />
    </div>
  );
}
