import { revalidatePath } from "next/cache";

import { AdminCard, AdminPageHero, AdminSectionTitle } from "@/components/admin/admin-ui";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { Tables, TablesUpdate } from "@/types/database";

const USERS_LIMIT = 40;

type MetricsRow = {
  user_id: string;
  total_pulls: number | null;
  last_gacha_at: string | null;
  last_card_name: string | null;
  last_card_rarity: string | null;
  pending_results: number | null;
  error_results: number | null;
  last_error_at: string | null;
  last_error_detail: string | null;
  last_result_status: string | null;
};

type TicketRow = {
  user_id: string;
  quantity: number | null;
  ticket_types: {
    code: string;
    name: string;
    color_token: string | null;
  } | null;
};

type TicketSummary = {
  code: string;
  name: string;
  quantity: number;
  colorToken: string | null;
};

async function manageUserAction(formData: FormData) {
  "use server";
  const userId = String(formData.get("userId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  if (!userId) {
    throw new Error("ユーザーIDが指定されていません");
  }
  if (!intent) {
    throw new Error("操作種別が不明です");
  }

  const supabase = getServiceSupabase();
  const now = new Date().toISOString();
  const updates: TablesUpdate<"app_users"> = { updated_at: now };

  switch (intent) {
    case "block":
      updates.is_blocked = true;
      break;
    case "unblock":
      updates.is_blocked = false;
      break;
    case "delete":
      updates.is_blocked = true;
      updates.deleted_at = now;
      break;
    case "restore":
      updates.is_blocked = false;
      updates.deleted_at = null;
      break;
    default:
      throw new Error("サポートされていない操作です");
  }

  const { error } = await supabase.from("app_users").update(updates).eq("id", userId);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/users");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function buildTicketMap(rows: TicketRow[] = []): Map<string, TicketSummary[]> {
  const map = new Map<string, TicketSummary[]>();
  for (const row of rows) {
    const ticket = row.ticket_types;
    const summary: TicketSummary = {
      code: ticket?.code ?? "ticket",
      name: ticket?.name ?? "未分類",
      quantity: row.quantity ?? 0,
      colorToken: ticket?.color_token ?? null,
    };
    const list = map.get(row.user_id) ?? [];
    list.push(summary);
    map.set(row.user_id, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.code.localeCompare(b.code));
  }
  return map;
}

export default async function AdminUsersPage() {
  const supabase = getServiceSupabase();
  const { data: users, error } = await supabase
    .from("app_users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(USERS_LIMIT);
  if (error) {
    throw new Error(error.message);
  }
  const userList = (users ?? []) as Tables<"app_users">[];
  const userIds = userList.map((user) => user.id);

  let metricsRows: MetricsRow[] = [];
  if (userIds.length) {
    const { data: metricsData, error: metricsError } = await supabase.rpc("get_admin_user_metrics", {
      target_user_ids: userIds,
    });
    if (metricsError) {
      throw new Error(metricsError.message);
    }
    metricsRows = (metricsData ?? []) as MetricsRow[];
  }
  const metricsMap = new Map(metricsRows.map((row) => [row.user_id, row]));

  let ticketRows: TicketRow[] = [];
  if (userIds.length) {
    const { data: ticketData, error: ticketError } = await supabase
      .from("user_tickets")
      .select("user_id, quantity, ticket_types:ticket_type_id ( code, name, color_token )")
      .in("user_id", userIds);
    if (ticketError) {
      throw new Error(ticketError.message);
    }
    ticketRows = (ticketData ?? []) as TicketRow[];
  }
  const ticketMap = buildTicketMap(ticketRows);

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Users"
        title="ユーザー管理"
        description="チケット残高、ガチャ履歴、ブロック / 削除状態を確認しながら制御します。"
      />

      <AdminCard>
        <AdminSectionTitle
          title="最近のユーザー"
          description="最大40名までの最新アカウント状態とエラーログを一覧できます"
        />
        <div className="mt-6 space-y-4">
          {userList.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/60">
              ユーザーが見つかりませんでした。
            </p>
          )}
          {userList.map((user) => {
            const metrics = metricsMap.get(user.id);
            const tickets = ticketMap.get(user.id) ?? [];
            const loginBonusText = user.login_bonus_last_claim_at
              ? `${formatDate(user.login_bonus_last_claim_at)} / 連続 ${user.login_bonus_streak ?? 0} 日`
              : "未取得";
            const containerClasses = [
              "rounded-3xl border border-white/12 bg-white/[0.03] p-5 shadow-panel-inset",
              user.deleted_at ? "opacity-70" : "",
            ].filter(Boolean).join(" ");

            return (
              <div key={user.id} className={containerClasses}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">USER</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">{user.display_name ?? "No Name"}</h2>
                    <p className="text-sm text-white/70">{user.email}</p>
                    <p className="text-xs text-white/40">ID: {user.id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.35em]">
                    {user.is_admin && (
                      <span className="rounded-full border border-amber-300/40 bg-amber-200/10 px-3 py-1 text-amber-200">
                        ADMIN
                      </span>
                    )}
                    {user.is_blocked && (
                      <span className="rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1 text-red-200">
                        BLOCKED
                      </span>
                    )}
                    {user.deleted_at && (
                      <span className="rounded-full border border-white/20 px-3 py-1 text-white/70">DELETED</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">ガチャ履歴</p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-white/80">
                      <div>
                        <dt className="text-white/60">総ガチャ</dt>
                        <dd className="text-lg font-semibold text-white">{metrics?.total_pulls ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="text-white/60">未付与</dt>
                        <dd className="text-lg font-semibold text-white">{metrics?.pending_results ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="text-white/60">エラー</dt>
                        <dd className="text-lg font-semibold text-red-300">{metrics?.error_results ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="text-white/60">直近ステータス</dt>
                        <dd className="text-sm text-white/80">{metrics?.last_result_status ?? "---"}</dd>
                      </div>
                    </dl>
                    <p className="text-xs text-white/60">最終: {formatDate(metrics?.last_gacha_at)}</p>
                    {metrics?.last_card_name && (
                      <p className="text-xs text-white/70">
                        直近カード: {metrics.last_card_name} ({metrics.last_card_rarity ?? "?"})
                      </p>
                    )}
                    {metrics?.last_error_detail && (
                      <p className="text-xs text-red-300 line-clamp-2">
                        最後のエラー: {metrics.last_error_detail}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">チケット / ログイン</p>
                    <div className="flex flex-wrap gap-2">
                      {tickets.length === 0 && (
                        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">残高なし</span>
                      )}
                      {tickets.map((ticket) => (
                        <span
                          key={`${user.id}-${ticket.code}`}
                          className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80"
                        >
                          {ticket.name}: {ticket.quantity}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-white/70">
                      <p>ログイン: {formatDate(user.last_login_at)}</p>
                      <p>ログインボーナス: {loginBonusText}</p>
                      <p>登録日: {formatDate(user.created_at)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">アクション</p>
                    <div className="flex flex-wrap gap-2">
                      <form action={manageUserAction} className="flex-1 min-w-[140px]">
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          name="intent"
                          value={user.is_blocked ? "unblock" : "block"}
                          className="w-full rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                        >
                          {user.is_blocked ? "ブロック解除" : "ブロック"}
                        </button>
                      </form>
                      <form action={manageUserAction} className="flex-1 min-w-[140px]">
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          name="intent"
                          value={user.deleted_at ? "restore" : "delete"}
                          className={`w-full rounded-2xl px-4 py-2 text-sm font-semibold ${user.deleted_at ? "border border-white/30 text-white" : "border border-red-400/60 text-red-200"}`}
                        >
                          {user.deleted_at ? "復元" : "利用停止"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>
    </div>
  );
}
