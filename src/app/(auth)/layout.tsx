import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-hall-background text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-hall-grid opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff2d95_0%,transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#30f0ff_0%,transparent_55%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-10">
        <div className="w-full rounded-[32px] border border-white/10 bg-black/40 p-8 shadow-panel-inset backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
