import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-primary text-primary">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/05 to-transparent" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-14">
        <div className="w-full rounded-[32px] border border-accent/25 bg-card/80 p-8 shadow-library-card">
          {children}
        </div>
      </div>
    </div>
  );
}
