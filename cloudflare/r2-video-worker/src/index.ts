/**
 * R2 Video CDN Worker
 * 
 * R2バケットから動画を配信し、CDNキャッシュを有効化する軽量Worker
 */

interface Env {
  R2_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // パスからR2オブジェクトキーを取得（先頭のスラッシュを除去）
    const objectKey = url.pathname.slice(1);
    
    // R2からオブジェクトを取得
    const object = await env.R2_BUCKET.get(objectKey);
    
    if (!object) {
      return new Response('Not Found', { status: 404 });
    }
    
    // レスポンスヘッダーを構築
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('ETag', object.httpEtag);
    
    // Range リクエスト対応
    if (object.range) {
      headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
    }
    
    // キャッシュ設定（重要）
    headers.set('Cache-Control', 'public, max-age=2592000'); // 30日間キャッシュ
    headers.set('CDN-Cache-Control', 'public, max-age=2592000'); // Cloudflare CDN用
    
    // CORS設定（必要に応じて）
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    
    // Rangeリクエストの場合は206、通常は200
    const status = object.range ? 206 : 200;
    
    return new Response(object.body, {
      status,
      headers,
    });
  },
};
