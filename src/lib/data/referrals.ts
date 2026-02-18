import crypto from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables } from '@/types/database';
import { grantTickets } from '@/lib/data/tickets';

type DbClient = SupabaseClient<Database>;

const REFERRAL_SETTINGS_ID = 'global';

export type ReferralSettings = Pick<
  Tables<'referral_settings'>,
  'referrer_ticket_amount' | 'referee_ticket_amount' | 'ticket_code'
>;

export async function getReferralSettings(client: DbClient): Promise<ReferralSettings> {
  const { data, error } = await client
    .from('referral_settings')
    .select('*')
    .eq('id', REFERRAL_SETTINGS_ID)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  if (data) {
    return data as Tables<'referral_settings'>;
  }
  const defaults: ReferralSettings = {
    referrer_ticket_amount: 10,
    referee_ticket_amount: 10,
    ticket_code: 'basic',
  };
  await client
    .from('referral_settings')
    .upsert({ id: REFERRAL_SETTINGS_ID, ...defaults });
  return defaults;
}

export async function updateReferralSettings(
  client: DbClient,
  payload: ReferralSettings,
  adminUserId?: string,
) {
  await client
    .from('referral_settings')
    .upsert({
      id: REFERRAL_SETTINGS_ID,
      ...payload,
      updated_by: adminUserId ?? null,
      updated_at: new Date().toISOString(),
    });
}

function normalizeCode(raw: string) {
  return raw.trim().toUpperCase();
}

function generateReferralCodeValue() {
  return crypto.randomBytes(4).toString('hex').slice(0, 8).toUpperCase();
}

export async function fetchReferralCode(client: DbClient, userId: string) {
  const { data, error } = await client
    .from('referral_codes')
    .select('*')
    .eq('app_user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return (data as Tables<'referral_codes'>) ?? null;
}

export async function createReferralCodeForUser(client: DbClient, userId: string) {
  const { data: userRow, error: userError } = await client
    .from('app_users')
    .select('id, referral_blocked')
    .eq('id', userId)
    .maybeSingle();
  if (userError) throw userError;
  const user = userRow as Tables<'app_users'> | null;
  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }
  if (user.referral_blocked) {
    throw new Error('このユーザーは紹介機能が停止されています');
  }
  const existing = await fetchReferralCode(client, userId);
  if (existing) {
    return existing;
  }
  while (true) {
    const code = generateReferralCodeValue();
    const { data, error } = await client
      .from('referral_codes')
      .insert({ app_user_id: userId, code })
      .select('*')
      .single();
    if (error) {
      if (error.code === '23505') {
        continue;
      }
      throw error;
    }
    return data as Tables<'referral_codes'>;
  }
}

async function loadReferralContext(client: DbClient, rawCode: string) {
  const codeValue = normalizeCode(rawCode);
  if (!codeValue) {
    throw new Error('紹介コードを入力してください。');
  }
  const { data, error } = await client
    .from('referral_codes')
    .select('*')
    .eq('code', codeValue)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  if (!data) {
    throw new Error('紹介コードが見つかりません。');
  }
  const refCode = data as Tables<'referral_codes'>;
  if (refCode.usage_limit !== null && refCode.uses >= refCode.usage_limit) {
    throw new Error('この紹介コードは利用上限に達しています。');
  }
  const { data: referrerRow, error: referrerError } = await client
    .from('app_users')
    .select('id, referral_blocked, is_blocked, deleted_at')
    .eq('id', refCode.app_user_id)
    .maybeSingle();
  if (referrerError) throw referrerError;
  if (!referrerRow) {
    throw new Error('紹介コードの発行者が見つかりません。');
  }
  if (referrerRow.referral_blocked || referrerRow.is_blocked || referrerRow.deleted_at) {
    throw new Error('この紹介コードは現在利用できません。');
  }
  return { code: refCode, referrer: referrerRow };
}

export async function validateReferralCode(client: DbClient, rawCode: string) {
  await loadReferralContext(client, rawCode);
}

export type ReferralApplicationResult = {
  applied: boolean;
  referrerReward: number;
  refereeReward: number;
};

export async function applyReferralCode(
  client: DbClient,
  invitedUserId: string,
  rawCode?: string | null,
): Promise<ReferralApplicationResult> {
  if (!rawCode) {
    return { applied: false, referrerReward: 0, refereeReward: 0 };
  }
  const { code, referrer } = await loadReferralContext(client, rawCode);
  if (code.app_user_id === invitedUserId) {
    throw new Error('自分自身を紹介することはできません。');
  }

  const { data: existingClaim, error: claimError } = await client
    .from('referral_claims')
    .select('id')
    .eq('invited_user_id', invitedUserId)
    .maybeSingle();
  if (claimError && claimError.code !== 'PGRST116') {
    throw claimError;
  }
  if (existingClaim) {
    return { applied: false, referrerReward: 0, refereeReward: 0 };
  }

  const settings = await getReferralSettings(client);
  const referrerReward = Math.max(0, settings.referrer_ticket_amount ?? 0);
  const refereeReward = Math.max(0, settings.referee_ticket_amount ?? 0);
  const ticketCode = settings.ticket_code ?? 'basic';

  const now = new Date().toISOString();
  const { data: claimData, error: insertError } = await client
    .from('referral_claims')
    .insert({
      referral_code_id: code.id,
      invited_user_id: invitedUserId,
      referrer_reward_tickets: referrerReward,
      referee_reward_tickets: refereeReward,
      status: 'granted',
      granted_at: now,
    })
    .select('*')
    .single();
  if (insertError || !claimData) {
    throw insertError ?? new Error('紹介履歴の作成に失敗しました。');
  }

  await client
    .from('referral_codes')
    .update({ uses: (code.uses ?? 0) + 1 })
    .eq('id', code.id);

  await client
    .from('app_users')
    .update({ referred_by_user_id: referrer.id, updated_at: now })
    .eq('id', invitedUserId);

  if (referrerReward > 0) {
    await grantTickets(client, referrer.id, ticketCode, referrerReward);
  }
  if (refereeReward > 0) {
    await grantTickets(client, invitedUserId, ticketCode, refereeReward);
  }

  return { applied: true, referrerReward, refereeReward };
}

export type ReferralStats = {
  code: string | null;
  totalInvites: number;
  totalTicketsEarned: number;
  recentInvites: {
    userId: string;
    name: string;
    email: string | null;
    createdAt: string;
    tickets: number;
  }[];
};

export async function fetchReferralStats(client: DbClient, userId: string): Promise<ReferralStats> {
  try {
    const codeRow = await fetchReferralCode(client, userId);
    if (!codeRow) {
      return { code: null, totalInvites: 0, totalTicketsEarned: 0, recentInvites: [] };
    }

    const { data, error } = await client
      .from('referral_claims')
      .select('invited_user_id, created_at, referrer_reward_tickets')
      .eq('referral_code_id', codeRow.id)
      .eq('status', 'granted')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      console.error('Error fetching referral claims:', error);
      throw new Error(`紹介履歴の取得に失敗しました: ${error.message}`);
    }

    const invitedUserIds = (data ?? []).map((row) => row.invited_user_id);
    const invitedUsersMap = new Map<string, { display_name: string; email: string | null }>();
    if (invitedUserIds.length > 0) {
      const { data: invitedUsers, error: invitedUsersError } = await client
        .from('app_users')
        .select('id, display_name, email')
        .in('id', invitedUserIds);
      if (invitedUsersError) {
        console.error('Error fetching invited users:', invitedUsersError);
        throw new Error(`招待ユーザー情報の取得に失敗しました: ${invitedUsersError.message}`);
      }
      for (const u of invitedUsers ?? []) {
        invitedUsersMap.set(u.id, { display_name: u.display_name ?? '名無しさん', email: u.email });
      }
    }

    const totalTickets = (data ?? []).reduce((sum, row) => sum + (row.referrer_reward_tickets ?? 0), 0);
    const stats: ReferralStats = {
      code: codeRow.code,
      totalInvites: data?.length ?? 0,
      totalTicketsEarned: totalTickets,
      recentInvites: (data ?? []).map((row) => {
        const user = invitedUsersMap.get(row.invited_user_id);
        return {
          userId: row.invited_user_id,
          name: user?.display_name ?? '名無しさん',
          email: user?.email ?? null,
          createdAt: row.created_at,
          tickets: row.referrer_reward_tickets ?? 0,
        };
      }),
    };
    return stats;
  } catch (error) {
    console.error('fetchReferralStats error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('紹介統計の取得中に予期しないエラーが発生しました');
  }
}
