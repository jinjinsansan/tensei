import type {
  CollectionEdgeEvent,
  CollectionResponse,
  CollectionSnapshot,
} from './types';

export class CollectionState {
  private snapshot: CollectionSnapshot | null = null;

  constructor(private readonly state: DurableObjectState) {
    this.state.blockConcurrencyWhile(async () => {
      this.snapshot = (await this.state.storage.get<CollectionSnapshot>('snapshot')) ?? null;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/collection') {
      return this.handleGet(url);
    }
    if (request.method === 'PUT' && url.pathname === '/collection/snapshot') {
      const body = await request.json().catch(() => ({}));
      return this.handleSnapshot(body);
    }
    if (request.method === 'POST' && url.pathname === '/collection/event') {
      const body = await request.json().catch(() => ({}));
      return this.handleEvent(body);
    }
    return new Response('Not Found', { status: 404 });
  }

  private handleGet(url: URL) {
    if (!this.snapshot) {
      return new Response(null, { status: 404 });
    }
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10) || 50;
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10) || 0;
    const response = buildResponse(this.snapshot, limit, offset);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleSnapshot(body: unknown) {
    const snapshot = validateSnapshot(body);
    this.snapshot = snapshot;
    await this.state.storage.put('snapshot', snapshot);
    return new Response(null, { status: 204 });
  }

  private async handleEvent(body: unknown) {
    if (!this.snapshot) {
      return new Response(null, { status: 202 });
    }

    const event = validateEvent(body);
    
    if (event.type === 'add') {
      const entry = event.entry;
      this.snapshot.collection = [entry, ...this.snapshot.collection.filter((item) => item.id !== entry.id)].sort(
        (a, b) => new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime(),
      );
    } else if (event.type === 'remove') {
      this.snapshot.collection = this.snapshot.collection.filter((item) => item.id !== event.inventoryId);
    }
    
    this.snapshot.totalOwned += event.totalOwnedDelta ?? 0;
    this.snapshot.distinctOwned += event.distinctOwnedDelta ?? 0;
    if (this.snapshot.totalOwned < 0) this.snapshot.totalOwned = 0;
    if (this.snapshot.distinctOwned < 0) this.snapshot.distinctOwned = 0;
    if (this.snapshot.distinctOwned > this.snapshot.totalAvailable) {
      this.snapshot.distinctOwned = this.snapshot.totalAvailable;
    }
    this.snapshot.updatedAt = new Date().toISOString();

    await this.state.storage.put('snapshot', this.snapshot);
    return new Response(null, { status: 200 });
  }
}

function buildResponse(
  snapshot: CollectionSnapshot,
  limit: number,
  offset: number,
): CollectionResponse {
  const boundedLimit = Math.max(1, limit);
  const boundedOffset = Math.max(0, offset);
  const start = boundedOffset;
  const end = Math.min(start + boundedLimit, snapshot.collection.length);
  const collection = snapshot.collection.slice(start, end);
  const hasMore = snapshot.totalOwned > boundedOffset + collection.length;
  return {
    totalOwned: snapshot.totalOwned,
    distinctOwned: snapshot.distinctOwned,
    totalAvailable: snapshot.totalAvailable,
    cards: snapshot.cards,
    collection,
    page: {
      limit: boundedLimit,
      offset: boundedOffset,
      hasMore,
    },
  };
}

function validateSnapshot(body: unknown): CollectionSnapshot {
  if (!body || typeof body !== 'object' || !('snapshot' in body)) {
    throw new Error('Invalid snapshot payload');
  }
  const snapshot = (body as { snapshot?: CollectionSnapshot }).snapshot;
  if (!snapshot) {
    throw new Error('Snapshot missing');
  }
  if (!Array.isArray(snapshot.collection) || !Array.isArray(snapshot.cards)) {
    throw new Error('Malformed snapshot');
  }
  return snapshot;
}

function validateEvent(body: unknown): CollectionEdgeEvent {
  if (!body || typeof body !== 'object' || !('event' in body)) {
    throw new Error('Invalid event payload');
  }
  const event = (body as { event?: CollectionEdgeEvent }).event;
  if (!event || typeof event !== 'object') {
    throw new Error('Event missing');
  }
  if (!('type' in event) || (event.type !== 'add' && event.type !== 'remove')) {
    throw new Error('Event type must be "add" or "remove"');
  }
  if (event.type === 'add' && !('entry' in event)) {
    throw new Error('Add event requires entry');
  }
  if (event.type === 'remove' && !('inventoryId' in event)) {
    throw new Error('Remove event requires inventoryId');
  }
  return event;
}
