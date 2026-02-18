import { NextResponse } from "next/server";

import { fetchAuthedContext } from "@/lib/app/session";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getPublicEnv } from "@/lib/env";
import { deliverNotifications } from "@/lib/notifications/delivery";
import type { Tables } from "@/types/database";

export async function POST(req: Request) {
  try {
    const supabase = getServiceSupabase();
    const context = await fetchAuthedContext(supabase);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = (await req.json()) as { targetUserId?: string };
    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const userId = context.user.id;
    if (targetUserId === userId) {
      return NextResponse.json({ error: "自分自身には申請できません" }, { status: 400 });
    }

    const { data: targetUser, error: targetError } = await supabase
      .from("app_users")
      .select("*")
      .eq("id", targetUserId)
      .single();
    if (targetError || !targetUser) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }
    const targetAppUser = targetUser as Tables<'app_users'>;
    const senderName = context.user.display_name ?? context.user.email ?? "プレイヤー";
    const targetName = targetAppUser.display_name ?? targetAppUser.email ?? targetAppUser.id;
    const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL ?? "https://raisegacha.com";
    const socialUrl = `${siteUrl}/social`;
    const notificationUsers = new Map<string, Tables<'app_users'>>([
      [targetAppUser.id, targetAppUser],
      [context.user.id, context.user],
    ]);

    // 既にフレンドかチェック
    const { data: existingFriend } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", userId)
      .eq("friend_user_id", targetUserId)
      .maybeSingle();
    if (existingFriend) {
      return NextResponse.json({ ok: true, status: "already_friends" });
    }

    // 相手からの保留中リクエストがあれば自動承認
    const { data: inboundReq } = await supabase
      .from("friend_requests")
      .select("id, from_user_id, to_user_id, status")
      .eq("from_user_id", targetUserId)
      .eq("to_user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (inboundReq) {
      const now = new Date().toISOString();
      await supabase.from("friend_requests").update({ status: "accepted", resolved_at: now }).eq("id", inboundReq.id);

      // 双方向のfriend行を作成（存在しない場合のみ）
      await Promise.all([
        supabase
          .from("friends")
          .upsert({ user_id: userId, friend_user_id: targetUserId }, { onConflict: "user_id,friend_user_id" }),
        supabase
          .from("friends")
          .upsert({ user_id: targetUserId, friend_user_id: userId }, { onConflict: "user_id,friend_user_id" }),
      ]);

      await deliverNotifications(
        [
          {
            userId: targetUserId,
            title: "フレンド申請が承認されました",
            message: `${context.user.display_name ?? context.user.email ?? "フレンド"} とフレンドになりました。SOCIALホールで確認できます。`,
            linkUrl: socialUrl,
            category: 'friend',
            emailSubject: 'フレンド承認が完了しました',
          },
          {
            userId,
            title: "フレンド申請が承認されました",
            message: `${targetName} とフレンドになりました。`,
            linkUrl: socialUrl,
            category: 'friend',
            emailSubject: 'フレンド承認が完了しました',
          },
        ],
        { userCache: notificationUsers },
      );

      return NextResponse.json({ ok: true, status: "accepted" });
    }

    // 既存の自分→相手リクエストがあれば何もしない
    const { data: existingReq } = await supabase
      .from("friend_requests")
      .select("id, status")
      .eq("from_user_id", userId)
      .eq("to_user_id", targetUserId)
      .maybeSingle();

    if (existingReq && existingReq.status === "pending") {
      return NextResponse.json({ ok: true, status: "pending" });
    }

    await supabase.from("friend_requests").upsert({
      from_user_id: userId,
      to_user_id: targetUserId,
      status: "pending",
    });

    await deliverNotifications(
      [
        {
          userId: targetUserId,
          title: "新しいフレンド申請",
          message: `${senderName} からフレンド申請が届きました。SOCIALホールで承認できます。`,
          linkUrl: socialUrl,
          category: 'friend',
          emailSubject: 'フレンド申請が届きました',
        },
      ],
      { userCache: notificationUsers },
    );

    return NextResponse.json({ ok: true, status: "requested" });
  } catch (error) {
    console.error("friend request error", error);
    return NextResponse.json({ error: "フレンド申請に失敗しました" }, { status: 500 });
  }
}
