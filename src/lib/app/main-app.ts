import { GACHA_DEFINITIONS } from '@/constants/gacha';
import { DEFAULT_TICKET_BALANCES, type TicketBalanceItem } from '@/lib/utils/tickets';
import type { Tables } from '@/types/database';

export type MainAppSnapshot = {
  user: { id: string; email?: string | null; displayName?: string | null; lastLoginAt?: string | null } | null;
  tickets: TicketBalanceItem[];
  gachaCatalog: typeof GACHA_DEFINITIONS;
  lastUpdated: string;
};

type SnapshotInput = {
  user?: Tables<'app_users'> | null;
  tickets?: TicketBalanceItem[];
};

export function loadMainAppSnapshot({ user, tickets }: SnapshotInput): MainAppSnapshot {
  return {
    user: user
      ? { id: user.id, email: user.email, displayName: user.display_name, lastLoginAt: user.last_login_at }
      : null,
    tickets: tickets ?? DEFAULT_TICKET_BALANCES,
    gachaCatalog: GACHA_DEFINITIONS,
    lastUpdated: new Date().toISOString(),
  };
}
