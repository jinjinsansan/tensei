import { NextRequest, NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";
import { getServiceSupabase } from "@/lib/supabase/service";
import { grantTickets } from "@/lib/data/tickets";
import { deliverNotifications } from "@/lib/notifications/delivery";
import type { Database } from "@/types/database";

const GLOBAL_CONFIG_ID = "00000000-0000-0000-0000-000000000001";

type LineTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<LineTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LINE token exchange failed: ${response.status} ${text}`);
  }
  return (await response.json()) as LineTokenResponse;
}

async function fetchLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LINE profile fetch failed: ${response.status} ${text}`);
  }
  return (await response.json()) as LineProfile;
}

async function getLineRewardPoints(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from("gacha_global_config")
    .select("line_reward_points")
    .eq("id", GLOBAL_CONFIG_ID)
    .maybeSingle();
  if (error) {
    console.error("Failed to load line reward config", error);
    return 0;
  }
  return typeof data?.line_reward_points === "number" ? data.line_reward_points : 0;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(`${origin}/mypage/line?status=line-login-denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/mypage/line?status=line-login-error`);
  }

  const supabase = getServiceSupabase();
  const { data: stateRow, error: stateError } = await supabase
    .from("line_link_states")
    .select("*")
    .eq("state", state)
    .maybeSingle();

  if (stateError || !stateRow) {
    console.error("LINE state not found", stateError);
    return NextResponse.redirect(`${origin}/mypage/line?status=line-login-error`);
  }

  if (stateRow.rewarded_at) {
    return NextResponse.redirect(`${origin}/mypage/line?status=already-linked`);
  }

  const { LINE_LOGIN_CHANNEL_ID, LINE_CHANNEL_SECRET } = getServerEnv();
  if (!LINE_LOGIN_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
    console.error("LINE login env is not fully configured");
    return NextResponse.redirect(`${origin}/mypage/line?status=line-login-disabled`);
  }

  try {
    const redirectUri = `${origin}/api/line/login/callback`;
    const token = await exchangeCodeForToken(code, redirectUri, LINE_LOGIN_CHANNEL_ID, LINE_CHANNEL_SECRET);
    const profile = await fetchLineProfile(token.access_token);
    const lineUserId = profile.userId;

    if (!lineUserId) {
      throw new Error("LINE profile missing userId");
    }

    const { data: duplicate } = await supabase
      .from("line_link_states")
      .select("id, user_id, rewarded_at")
      .eq("line_user_id", lineUserId)
      .not("rewarded_at", "is", null)
      .maybeSingle();

    if (duplicate) {
      if (duplicate.user_id !== stateRow.user_id) {
        return NextResponse.redirect(`${origin}/mypage/line?status=line-user-already-linked`);
      }
      return NextResponse.redirect(`${origin}/mypage/line?status=already-linked`);
    }

    const rewardPoints = await getLineRewardPoints(supabase);

    if (rewardPoints > 0) {
      await grantTickets(supabase, stateRow.user_id, "n_point", rewardPoints);
      const { data: user } = await supabase
        .from("app_users")
        .select("id, email, display_name")
        .eq("id", stateRow.user_id)
        .maybeSingle();
      if (user) {
        await deliverNotifications(
          [
            {
              userId: user.id,
              title: "LINE特典を付与しました",
              message: `LINE連携が完了し、${rewardPoints} Nポイントをプレゼントしました。`,
              linkUrl: `${origin}/mypage/tickets`,
              category: "system",
              emailSubject: "LINE特典の付与が完了しました",
            },
          ],
          { userCache: new Map([[user.id, user]]) },
        );
      }
    }

    const { error: finalizeError } = await supabase
      .from("line_link_states")
      .update({ line_user_id: lineUserId, rewarded_at: new Date().toISOString() })
      .eq("id", stateRow.id);
    if (finalizeError) {
      throw finalizeError;
    }

    const pointsParam = `&points=${rewardPoints}`;
    return NextResponse.redirect(`${origin}/mypage/line?status=success${pointsParam}`);
  } catch (error) {
    console.error("LINE callback error", error);
    return NextResponse.redirect(`${origin}/mypage/line?status=line-login-error`);
  }
}
