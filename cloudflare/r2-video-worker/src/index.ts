interface Env {
  R2_BUCKET: R2Bucket;
}

const CACHE_MAX_AGE = 2592000; // 30日
const CACHE_VERSION = 'v2'; // ファイル更新時にここを変えてエッジキャッシュをパージ

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

    // キャッシュキーはバージョン付き URL（CACHE_VERSION を変えると全キャッシュ無効化）
    const versionedUrl = `${url.toString()}?_cv=${CACHE_VERSION}`;
    const cacheKey = new Request(versionedUrl, { method: 'GET' });

    // キャッシュ HIT の場合: Cloudflare の cache.match は Range を自動処理する
    const cached = await cache.match(cacheKey);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('CF-Cache-Status', 'HIT');
      return new Response(cached.body, { status: cached.status, headers });
    }

    // キャッシュ MISS: R2 から Range に応じて取得
    const objectKey = url.pathname.slice(1);
    const object = rangeHeader
      ? await env.R2_BUCKET.get(objectKey, { range: request.headers })
      : await env.R2_BUCKET.get(objectKey);

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
    headers.set('CF-Cache-Status', 'MISS');

    let status = 200;
    if (rangeHeader && object.range && 'offset' in object.range) {
      const { offset, length } = object.range as { offset: number; length: number };
      headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
      headers.set('Content-Length', String(length));
      status = 206;
    } else {
      headers.set('Content-Length', String(object.size));
    }

    const response = new Response(object.body, { status, headers });

    // 全体取得（非 Range）のときだけキャッシュに保存
    if (!rangeHeader) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  },
};

export default worker;
