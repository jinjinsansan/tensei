import { getPublicEnv } from '@/lib/env';

const publicEnv = getPublicEnv();
const DEFAULT_BASE = '/videos';
const rawBase = publicEnv.NEXT_PUBLIC_GACHA_ASSET_BASE_URL?.trim();
const normalizedBase = normalizeBase(rawBase?.length ? rawBase : DEFAULT_BASE);

function normalizeBase(value: string | undefined | null): string {
  if (!value) return '';
  if (value === '/') return '';
  return value.replace(/\/+$/, '');
}

function normalizeSegment(segment: string | number): string {
  return String(segment).replace(/^\/+/, '').replace(/\/+$/, '');
}

function joinPath(base: string, segments: (string | number | undefined | null)[]): string {
  const filtered = segments.filter((segment): segment is string | number => segment !== undefined && segment !== null);
  const path = filtered.map((segment) => normalizeSegment(segment)).filter(Boolean).join('/');
  if (!base && !path) return '';
  if (!base) return `/${path}`;
  if (!path) return base;
  return `${base}/${path}`;
}

export function buildGachaAssetPath(...segments: (string | number | undefined | null)[]): string {
  return joinPath(normalizedBase, segments);
}

export function buildCommonAssetPath(...segments: (string | number | undefined | null)[]): string {
  return buildGachaAssetPath('common', ...segments);
}

export function buildCharacterAssetPath(
  characterId: string,
  ...segments: (string | number | undefined | null)[]
): string {
  return buildGachaAssetPath('characters', characterId, ...segments);
}

export function getAssetBase(): string {
  return normalizedBase;
}
