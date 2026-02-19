import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";

function verifyLineSignature(body: string, signature: string | null, channelSecret?: string) {
  if (!channelSecret) {
    return true;
  }
  if (!signature) {
    return false;
  }
  const hmac = crypto.createHmac("sha256", channelSecret);
  hmac.update(body);
  const expected = Buffer.from(hmac.digest("base64"));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, provided);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");
  const { LINE_CHANNEL_SECRET } = getServerEnv();

  if (!verifyLineSignature(rawBody, signature, LINE_CHANNEL_SECRET)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown = null;
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error("LINE webhook invalid JSON", error);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("LINE webhook payload", payload);
  }

  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
