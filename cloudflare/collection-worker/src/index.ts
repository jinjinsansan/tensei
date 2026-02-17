import { CollectionState } from './state';
import type { CollectionEdgeEvent, CollectionSnapshot } from './types';

type Env = {
  COLLECTION_STATE: DurableObjectNamespace;
  COLLECTION_API_KEY: string;
};

const worker: ExportedHandler<Env> = {
  async fetch(request, env) {
    if (!env.COLLECTION_API_KEY) {
      return new Response('COLLECTION_API_KEY not configured', { status: 500 });
    }

    if (!authorize(request, env)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/collection') {
      return handleCollectionGet(url, env);
    }
    if (request.method === 'PUT' && url.pathname === '/collection/snapshot') {
      const body = await request.json().catch(() => ({}));
      return handleSnapshot(body, env);
    }
    if (request.method === 'POST' && url.pathname === '/collection/event') {
      const body = await request.json().catch(() => ({}));
      return handleEvent(body, env);
    }
    return new Response('Not Found', { status: 404 });
  },
};

export default worker;
export { CollectionState };

function authorize(request: Request, env: Env) {
  const expected = `Bearer ${env.COLLECTION_API_KEY}`;
  const provided = request.headers.get('Authorization');
  return provided === expected;
}

function getStub(env: Env, userId: string) {
  const id = env.COLLECTION_STATE.idFromName(userId);
  return env.COLLECTION_STATE.get(id);
}

async function handleCollectionGet(url: URL, env: Env) {
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return new Response('userId is required', { status: 400 });
  }
  const limit = url.searchParams.get('limit') ?? '50';
  const offset = url.searchParams.get('offset') ?? '0';
  const stub = getStub(env, userId);
  const target = new URL('https://do/collection');
  target.searchParams.set('limit', limit);
  target.searchParams.set('offset', offset);
  return stub.fetch(target.toString());
}

async function handleSnapshot(body: unknown, env: Env) {
  if (!body || typeof body !== 'object') {
    return new Response('Invalid payload', { status: 400 });
  }
  const { userId, snapshot } = body as {
    userId?: string;
    snapshot?: CollectionSnapshot;
  };
  if (!userId || !snapshot) {
    return new Response('userId and snapshot are required', { status: 400 });
  }
  const stub = getStub(env, userId);
  return stub.fetch('https://do/collection/snapshot', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshot }),
  });
}

async function handleEvent(body: unknown, env: Env) {
  if (!body || typeof body !== 'object') {
    return new Response('Invalid payload', { status: 400 });
  }
  const { userId, event } = body as {
    userId?: string;
    event?: CollectionEdgeEvent;
  };
  if (!userId || !event) {
    return new Response('userId and event are required', { status: 400 });
  }
  const stub = getStub(env, userId);
  return stub.fetch('https://do/collection/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
  });
}
