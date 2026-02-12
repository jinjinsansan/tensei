import { GACHA_DEFINITIONS } from '@/constants/gacha';
import { DEFAULT_TICKET_BALANCES, type TicketBalanceItem } from '@/lib/utils/tickets';
import type { Tables } from '@/types/database';

function parseTickets(session?: Tables<'user_sessions'> | null): TicketBalanceItem[] {
  const metadata = session?.metadata;
  const value = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? (metadata as { tickets?: number })
    : {};
  const balance = typeof value.tickets === 'number' ? value.tickets : 10;
  return DEFAULT_TICKET_BALANCES.map((ticket) =>
    ticket.code === 'basic' ? { ...ticket, quantity: balance } : ticket
  );
}

export type MainAppSnapshot = {
  user: { id: string } | null;
  tickets: TicketBalanceItem[];
  gachaCatalog: typeof GACHA_DEFINITIONS;
  lastUpdated: string;
};

export function loadMainAppSnapshot(session?: Tables<'user_sessions'> | null): MainAppSnapshot {
  return {
    user: session ? { id: session.id } : null,
    tickets: parseTickets(session),
    gachaCatalog: GACHA_DEFINITIONS,
    lastUpdated: new Date().toISOString(),
  };
}
