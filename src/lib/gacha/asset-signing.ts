import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { getAssetBase } from '@/lib/gacha/assets';

type SigningConfig = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  ttlSeconds: number;
};

let cachedConfig: SigningConfig | null | undefined;
let cachedClient: S3Client | null = null;

function loadSigningConfig(): SigningConfig | null {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const ttlInput = process.env.GACHA_ASSET_SIGNING_TTL_SECONDS ?? '900';
  const ttlSeconds = Number(ttlInput) > 0 ? Number(ttlInput) : 900;

  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    cachedConfig = null;
    return cachedConfig;
  }

  cachedConfig = {
    accountId,
    bucket,
    accessKeyId,
    secretAccessKey,
    ttlSeconds,
  };
  return cachedConfig;
}

function getSigningConfig(): SigningConfig {
  const config = loadSigningConfig();
  if (!config) {
    throw new Error('Cloudflare R2 signing is not configured.');
  }
  return config;
}

function getS3Client(config: SigningConfig): S3Client {
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return cachedClient;
}

export async function signAssetPaths(paths: string[]): Promise<Record<string, string>> {
  const config = getSigningConfig();
  const client = getS3Client(config);
  const unique = Array.from(new Set(paths.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)));
  const signedEntries = await Promise.all(
    unique.map(async (path) => {
      const key = deriveStorageKey(path);
      if (!key) {
        throw new Error(`Asset path is not allowed: ${path}`);
      }
      const command = new GetObjectCommand({ Bucket: config.bucket, Key: key });
      const signedUrl = await getSignedUrl(client, command, { expiresIn: config.ttlSeconds });
      return [path, signedUrl] as const;
    }),
  );

  const lookup = Object.fromEntries(signedEntries);
  const result: Record<string, string> = {};
  paths.forEach((path) => {
    if (lookup[path]) {
      result[path] = lookup[path];
    }
  });
  return result;
}

function deriveStorageKey(rawPath: string): string {
  const stripped = stripQuery(rawPath.trim());
  if (!stripped) return '';
  const base = getAssetBase();
  const normalized = removeBase(stripped, base);
  const relative = normalized.replace(/^\/+/g, '');
  const withoutVideos = relative.startsWith('videos/') ? relative.slice('videos/'.length) : relative;
  const key = ensureAllowedPrefix(withoutVideos);
  return key;
}

function stripQuery(value: string): string {
  const [path] = value.split('?');
  return path;
}

function removeBase(path: string, base: string | null | undefined): string {
  if (base && path.startsWith(base)) {
    return path.slice(base.length);
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      if (base && base.startsWith('http')) {
        const baseUrl = new URL(base);
        if (url.origin === baseUrl.origin) {
          const basePath = baseUrl.pathname.replace(/\/+$|^\/+/g, '');
          if (basePath && url.pathname.startsWith(`/${basePath}`)) {
            return url.pathname.slice(basePath.length + 1);
          }
        }
      }
      return url.pathname;
    } catch {
      return path;
    }
  }
  return path;
}

function ensureAllowedPrefix(value: string): string {
  const trimmed = value.replace(/^\/+/g, '');
  if (trimmed.startsWith('common/')) {
    return trimmed;
  }
  if (trimmed.startsWith('characters/')) {
    return trimmed;
  }
  const commonIndex = trimmed.indexOf('common/');
  if (commonIndex >= 0) {
    return trimmed.slice(commonIndex);
  }
  const characterIndex = trimmed.indexOf('characters/');
  if (characterIndex >= 0) {
    return trimmed.slice(characterIndex);
  }
  return '';
}

export function isAssetSigningConfigured(): boolean {
  return Boolean(loadSigningConfig());
}
