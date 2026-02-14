"use client";

import { useEffect, useMemo, useState } from 'react';

const SIGNING_ENABLED = process.env.NEXT_PUBLIC_GACHA_ASSET_SIGNING_MODE === 'signed';

export function useSignedAssetResolver(sources: readonly string[]) {
  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    sources.forEach((src) => {
      if (src) set.add(src);
    });
    return Array.from(set);
  }, [sources]);

  const [resolvedMap, setResolvedMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!SIGNING_ENABLED || uniqueSources.length === 0) {
      setResolvedMap({});
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch('/api/gacha/assets/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: uniqueSources }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Signing API responded with ${response.status}`);
        }
        const data = (await response.json()) as { urls?: Record<string, string> };
        if (!controller.signal.aborted) {
          setResolvedMap(data.urls ?? {});
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to fetch signed asset URLs', error);
        setResolvedMap({});
      }
    })();

    return () => controller.abort();
  }, [uniqueSources]);

  return (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (!SIGNING_ENABLED) return path;
    return resolvedMap[path] ?? null;
  };
}
