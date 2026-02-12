import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables, Json } from '@/types/database';

type DbClient = SupabaseClient<Database>;
type SessionRow = Tables<'user_sessions'>;

type SessionMetadata = {
  tickets?: number;
  [key: string]: unknown;
};

function parseMetadata(metadata: Json): SessionMetadata {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as SessionMetadata;
  }
  return {};
}

export async function consumeTicket(
  client: DbClient,
  session: SessionRow,
  options?: { initialTickets?: number },
): Promise<{ remaining: number; session: SessionRow }> {
  const initialTickets = options?.initialTickets ?? 10;
  const metadata = parseMetadata(session.metadata);
  const balance = typeof metadata.tickets === 'number' ? metadata.tickets : initialTickets;
  if (balance <= 0) {
    throw new Error('チケットが足りません。');
  }
  const updatedMetadata: SessionMetadata = {
    ...metadata,
    tickets: balance - 1,
  };
  const { data, error } = await client
    .from('user_sessions')
    .update({ metadata: updatedMetadata as Json })
    .eq('id', session.id)
    .select('*')
    .single();
  if (error || !data) {
    throw error ?? new Error('チケット更新に失敗しました。');
  }
  return {
    remaining: updatedMetadata.tickets ?? 0,
    session: data as SessionRow,
  };
}
