import type { TabBarItem } from "@/components/layout/tab-bar";

export const MAIN_TAB_ITEMS: TabBarItem[] = [
  { label: "TICKET", href: "/home", icon: "ticket" },
  { label: "CARD", href: "/collection", icon: "collection" },
  { label: "GACHA", href: "/gacha", icon: "gacha", primary: true },
  { label: "SOCIAL", href: "/social", icon: "social" },
  { label: "MENU", href: "/mypage", icon: "menu" },
];
