export type TicketBalanceItem = {
  code: string;
  name: string;
  quantity: number;
  colorToken: string | null;
  sortOrder: number;
};

export const DEFAULT_TICKET_BALANCES: TicketBalanceItem[] = [
  { code: 'free', name: '無料の栞', quantity: 0, colorToken: 'bookmark-free', sortOrder: 0 },
  { code: 'basic', name: '銅の栞', quantity: 0, colorToken: 'bookmark-bronze', sortOrder: 1 },
  { code: 'epic', name: '銀の栞', quantity: 0, colorToken: 'bookmark-silver', sortOrder: 2 },
  { code: 'premium', name: '金の栞', quantity: 0, colorToken: 'bookmark-gold', sortOrder: 3 },
  { code: 'ex', name: '白金の栞', quantity: 0, colorToken: 'bookmark-platinum', sortOrder: 4 },
];

export function canonicalizeGachaId(id?: string | null) {
  if (!id) return null;
  return id.trim().toLowerCase();
}

export function applyTicketBalance(base: TicketBalanceItem[], quantity: number, code: string) {
  return base.map((entry) =>
    entry.code === code ? { ...entry, quantity } : entry
  );
}
