import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type HeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  badges?: ReactNode;
  actions?: ReactNode;
};

export function AdminPageHero({ eyebrow, title, description, badges, actions }: HeroProps) {
  return (
    <section className="rounded-3xl border border-white/12 bg-white/5 px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">{eyebrow}</p>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            {description && <p className="mt-2 text-sm text-white/70">{description}</p>}
          </div>
          {badges && <div className="flex flex-wrap gap-3 text-xs text-white/70">{badges}</div>}
        </div>
        {actions && <div className="w-full max-w-sm md:w-auto">{actions}</div>}
      </div>
    </section>
  );
}

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function AdminCard({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/12 bg-white/[0.04] p-6 shadow-[0_25px_90px_rgba(0,0,0,0.55)] backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminSubCard({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_15px_60px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminSectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {description && <p className="text-sm text-white/70">{description}</p>}
    </div>
  );
}
