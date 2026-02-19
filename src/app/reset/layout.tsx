import type { ReactNode } from "react";
import { TabBar } from "@/components/layout/tab-bar";
import { MAIN_TAB_ITEMS } from "@/components/layout/main-tab-items";

export default function ResetLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-hall-background text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-hall-grid opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff2d95_0%,transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#30f0ff_0%,transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-28 pt-10 sm:pb-32">
        {children}
      </div>

      <TabBar items={MAIN_TAB_ITEMS} />
    </div>
  );
}
