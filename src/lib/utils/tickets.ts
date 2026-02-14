export type TicketBalanceItem = {
  code: string;
  name: string;
  quantity: number;
  colorToken: string | null;
  sortOrder: number;
};

export const DEFAULT_TICKET_BALANCES: TicketBalanceItem[] = [
  { code: 'free', name: 'フリーチケット', quantity: 0, colorToken: 'neon-blue', sortOrder: 0 },
  { code: 'basic', name: 'ベーシックチケット', quantity: 0, colorToken: 'neon-yellow', sortOrder: 1 },
  { code: 'epic', name: 'エピックチケット', quantity: 0, colorToken: 'neon-pink', sortOrder: 2 },
  { code: 'premium', name: 'プレミアムチケット', quantity: 0, colorToken: 'neon-purple', sortOrder: 3 },
  { code: 'ex', name: 'EXチケット', quantity: 0, colorToken: 'glow-green', sortOrder: 4 },
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
