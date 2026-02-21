interface Env {
  R2_BUCKET: R2Bucket;
}

const CACHE_MAX_AGE = 2592000; // 30日

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

    // キャッシュキーは Range ヘッダーを除いた URL で統一
    const cacheKey = new Request(url.toString(), { method: 'GET' });

    // エッジキャッシュヒット確認
    const cached = await cache.match(cacheKey);
    if (cached) {
      const res = new Response(cached.body, cached);
      res.headers.set('CF-Cache-Status', 'HIT');
      return res;
    }

    const objectKey = url.pathname.slice(1);
    const rangeHeader = request.headers.get('Range');

    // Range リクエストは R2 に直接委譲（部分取得）
    const object = rangeHeader
      ? await env.R2_BUCKET.get(objectKey, { range: request.headers })
      : await env.R2_BUCKET.get(objectKey);

    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType ?? 'application/octet-stream');
    headers.set('ETag', object.httpEtag);
    headers.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
    headers.set('CDN-Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Accept-Ranges', 'bytes');

    let status = 200;
    if (object.range && 'offset' in object.range) {
      const { offset, length } = object.range as { offset: number; length: number };
      headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
      headers.set('Content-Length', String(length));
      status = 206;
    } else {
      headers.set('Content-Length', String(object.size));
    }

    const response = new Response(object.body, { status, headers });

    // Range リクエスト以外はエッジにキャッシュ保存
    if (!rangeHeader) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  },
};

export default worker;
