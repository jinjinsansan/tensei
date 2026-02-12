import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#1f1641,transparent_60%),linear-gradient(180deg,#0D0B2E,#2C1810)] text-library-text-primary">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(44,24,16,0.6),transparent_55%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-14">
        <div className="w-full rounded-[32px] border border-library-accent/25 bg-library-primary/80 p-8 shadow-library-card">
          {children}
        </div>
      </div>
    </div>
  );
}
