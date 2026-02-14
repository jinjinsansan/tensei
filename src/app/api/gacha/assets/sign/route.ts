import { NextResponse } from 'next/server';

import { signAssetPaths } from '@/lib/gacha/asset-signing';

type SignRequest = {
  paths?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SignRequest;
    if (!Array.isArray(body.paths)) {
      return NextResponse.json({ error: 'paths must be an array' }, { status: 400 });
    }

    const sanitized = body.paths
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value): value is string => value.length > 0);

    if (!sanitized.length) {
      return NextResponse.json({ urls: {} });
    }

    const urls = await signAssetPaths(sanitized);
    return NextResponse.json({ urls });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign asset paths';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
