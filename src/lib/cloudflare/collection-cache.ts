import type {
  CollectionEdgeEvent,
  CollectionResponse,
  CollectionSnapshot,
} from '@/lib/collection/types';

type FetchArgs = {
  userId: string;
  limit: number;
  offset: number;
};

const BASE_URL = process.env.CLOUDFLARE_COLLECTION_BASE_URL;
const API_KEY = process.env.CLOUDFLARE_COLLECTION_API_KEY;

export async function fetchCollectionFromEdge(
  args: FetchArgs,
): Promise<CollectionResponse | null> {
  if (!isConfigured()) return null;
  try {
    const url = new URL('/collection', getBaseUrl());
    url.searchParams.set('userId', args.userId);
    url.searchParams.set('limit', String(args.limit));
    url.searchParams.set('offset', String(args.offset));
    const response = await fetch(url, {
      headers: buildHeaders(),
    });
    if (response.status === 200) {
      return (await response.json()) as CollectionResponse;
    }
    if (response.status === 404) {
      return null;
    }
    console.warn('collection edge miss', response.status);
    return null;
  } catch (error) {
    console.warn('collection edge fetch failed', error);
    return null;
  }
}

export async function writeCollectionSnapshotToEdge(
  userId: string,
  snapshot: CollectionSnapshot,
): Promise<void> {
  if (!isConfigured()) return;
  try {
    const url = new URL('/collection/snapshot', getBaseUrl());
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...buildHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, snapshot }),
    });
    if (!response.ok) {
      console.warn('collection edge snapshot failed', response.status);
    }
  } catch (error) {
    console.warn('collection edge snapshot error', error);
  }
}

export async function emitCollectionEventToEdge(
  userId: string,
  event: CollectionEdgeEvent,
): Promise<void> {
  if (!isConfigured()) return;
  try {
    const url = new URL('/collection/event', getBaseUrl());
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...buildHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, event }),
    });
    if (!response.ok) {
      console.warn('collection edge event failed', response.status);
    }
  } catch (error) {
    console.warn('collection edge event error', error);
  }
}

function isConfigured() {
  return Boolean(BASE_URL && API_KEY);
}

function getBaseUrl() {
  if (!BASE_URL) {
    throw new Error('Missing CLOUDFLARE_COLLECTION_BASE_URL');
  }
  return BASE_URL;
}

function buildHeaders() {
  if (!API_KEY) {
    throw new Error('Missing CLOUDFLARE_COLLECTION_API_KEY');
  }
  return {
    Authorization: `Bearer ${API_KEY}`,
  };
}
