import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Toaster } from 'sonner';
import { TabBar, type TabBarItem } from '@/components/layout/tab-bar';
import { MainAppProvider } from '@/components/providers/main-app-provider';
import { getSessionWithSnapshot } from '@/lib/app/session';

const tabs: TabBarItem[] = [
  { label: '書庫入口', href: '/home', icon: 'entrance' },
  { label: '閲覧室', href: '/gacha', icon: 'reading' },
  { label: '書架', href: '/collection', icon: 'shelf' },
  { label: '書斎', href: '/mypage', icon: 'study' },
];

type MainLayoutProps = {
  children: ReactNode;
};

export default async function MainLayout({ children }: MainLayoutProps) {
  const context = await getSessionWithSnapshot().catch(() => null);
  if (!context) {
    redirect('/login');
  }
  const { snapshot } = context;

  return (
    <div className="fixed inset-0 text-library-text-primary">
      <Toaster position="top-center" theme="dark" richColors />
      <MainAppProvider initialSnapshot={snapshot}>
        <div
          className="relative h-full overflow-y-auto overflow-x-hidden"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-5xl justify-center px-0 pb-32 pt-6 sm:px-4 sm:pt-10">
            <div className="relative flex w-full flex-col px-4 pb-28 pt-4 sm:max-w-[430px] sm:px-6">
              <div className="relative flex-1">
                <div className="page-transition mx-auto w-full max-w-md space-y-8">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainAppProvider>

      <TabBar items={tabs} />
    </div>
  );
}
