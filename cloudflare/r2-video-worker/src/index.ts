interface Env {
  R2_BUCKET: R2Bucket;
}

const CACHE_MAX_AGE = 2592000; // 30日

// Range ヘッダーをキャッシュ済みの全体レスポンスに適用して 206 を返す
function applyRangeToFullResponse(fullResponse: Response, rangeHeader: string): Response {
  const contentLength = Number(fullResponse.headers.get('Content-Length') ?? '0');
  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  if (!match || !contentLength) return fullResponse;

  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : contentLength - 1;
  const safeEnd = Math.min(end, contentLength - 1);
  const safeStart = Math.max(0, start);
  const chunkSize = safeEnd - safeStart + 1;

  const headers = new Headers(fullResponse.headers);
  headers.set('Content-Range', `bytes ${safeStart}-${safeEnd}/${contentLength}`);
  headers.set('Content-Length', String(chunkSize));
  headers.set('CF-Cache-Status', 'HIT');

  return new Response(fullResponse.body, { status: 206, headers });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const cache = caches.default;
    const rangeHeader = request.headers.get('Range');

    // キャッシュキーは Range を除いた URL（全体キャッシュ）
    const cacheKey = new Request(url.toString(), { method: 'GET' });

    // キャッシュ HIT: Range があれば切り出して返す
    const cached = await cache.match(cacheKey);
    if (cached) {
      if (rangeHeader) {
        return applyRangeToFullResponse(cached, rangeHeader);
      }
      const res = new Response(cached.body, cached);
      res.headers.set('CF-Cache-Status', 'HIT');
      return res;
    }

    // キャッシュ MISS: R2 から全体取得してキャッシュに保存
    const objectKey = url.pathname.slice(1);
    const object = await env.R2_BUCKET.get(objectKey);

    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType ?? 'video/mp4');
    headers.set('ETag', object.httpEtag);
    headers.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
    headers.set('CDN-Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', String(object.size));
    headers.set('CF-Cache-Status', 'MISS');

    const fullResponse = new Response(object.body, { status: 200, headers });

    // エッジキャッシュに保存（次回以降は R2 不要）
    ctx.waitUntil(cache.put(cacheKey, fullResponse.clone()));

    // Range リクエストなら切り出して返す
    if (rangeHeader) {
      return applyRangeToFullResponse(fullResponse.clone(), rangeHeader);
    }

    return fullResponse;
  },
};

export default worker;
