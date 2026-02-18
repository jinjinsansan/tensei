import type { Tables } from '@/types/database';
import { getServiceSupabase } from '@/lib/supabase/service';
import { sendTransactionalEmail, renderNotificationEmail } from '@/lib/email/resend';

export type NotificationCategory = 'newsletter' | 'friend' | 'system' | 'reward';

export type NotificationPayload = {
  userId: string;
  title: string;
  message: string;
  linkUrl?: string;
  category?: NotificationCategory;
  emailSubject?: string;
  emailPreview?: string;
  broadcastId?: string | null;
  tags?: { name: string; value: string }[];
};

export type NotificationResult = {
  userId: string;
  notificationId?: string;
  emailStatus: 'sent' | 'skipped' | 'failed';
  error?: string;
};

type DeliveryOptions = {
  userCache?: Map<string, Tables<'app_users'>>;
  onDelivery?: (payload: NotificationPayload, result: NotificationResult) => void | Promise<void>;
};

export async function deliverNotifications(
  payloads: NotificationPayload[],
  options?: DeliveryOptions,
): Promise<NotificationResult[]> {
  if (!payloads.length) {
    return [];
  }
  const supabase = getServiceSupabase();
  const userMap = options?.userCache ?? new Map<string, Tables<'app_users'>>();
  const missingIds = payloads
    .map((payload) => payload.userId)
    .filter((id) => !userMap.has(id));
  if (missingIds.length) {
    const uniqueIds = Array.from(new Set(missingIds));
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .in('id', uniqueIds);
    if (error) {
      throw error;
    }
    for (const row of data ?? []) {
      userMap.set(row.id, row as Tables<'app_users'>);
    }
  }

  const results: NotificationResult[] = [];

  for (const payload of payloads) {
    const user = userMap.get(payload.userId);
    if (!user || user.is_blocked || user.deleted_at) {
      const skipped: NotificationResult = { userId: payload.userId, emailStatus: 'skipped' };
      results.push(skipped);
      if (options?.onDelivery) await options.onDelivery(payload, skipped);
      continue;
    }

    let inserted: Tables<'user_notifications'> | null = null;
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: user.id,
          category: payload.category ?? 'system',
          title: payload.title,
          message: payload.message,
          link_url: payload.linkUrl ?? null,
          broadcast_id: payload.broadcastId ?? null,
        })
        .select('*')
        .single();
      if (error) {
        throw error;
      }
      inserted = data as Tables<'user_notifications'>;
    } catch (error) {
      const failed: NotificationResult = {
        userId: payload.userId,
        emailStatus: 'failed',
        error: error instanceof Error ? error.message : 'Failed to insert notification',
      };
      results.push(failed);
      if (options?.onDelivery) await options.onDelivery(payload, failed);
      continue;
    }

    let emailStatus: NotificationResult['emailStatus'] = 'skipped';
    let errorMsg: string | undefined;

    if (user.email) {
      try {
        const { html, text } = renderNotificationEmail({
          title: payload.emailSubject ?? payload.title,
          body: payload.message,
          linkUrl: payload.linkUrl,
          previewText: payload.emailPreview,
        });
        await sendTransactionalEmail({
          to: user.email,
          subject: payload.emailSubject ?? payload.title,
          html,
          text,
          tags: payload.tags,
        });
        await supabase
          .from('user_notifications')
          .update({ emailed_at: new Date().toISOString() })
          .eq('id', inserted.id);
        emailStatus = 'sent';
      } catch (error) {
        emailStatus = 'failed';
        errorMsg = error instanceof Error ? error.message : 'Email send failed';
      }
    }

    const result: NotificationResult = {
      userId: payload.userId,
      notificationId: inserted.id,
      emailStatus,
      error: errorMsg,
    };
    results.push(result);
    if (options?.onDelivery) await options.onDelivery(payload, result);
  }

  return results;
}
