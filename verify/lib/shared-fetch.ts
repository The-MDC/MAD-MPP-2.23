/**
 * One request per URL, shared by every component that asks for it.
 *
 * The hub page mounts the News Flow, the news carousel and the ticker, and all three read /api/v1/news/satirical:
 * three identical requests on a rate-limited route. This de-duplicates concurrent calls (they share one in-flight
 * promise) and serves a successful answer from memory for `ttlMs`, so a re-mount or a tab switch does not refetch.
 *
 * Native by design: no new dependency (the build sandbox cannot update the lockfile; see app/layout.tsx), and
 * deliberately smaller than SWR: no revalidate-on-focus, no mutation. Only an `ok` response is cached, a failure is
 * never remembered, and the parsed object is shared, so callers must treat it as read-only.
 *
 * CLIENT-SIDE ONLY: the cache lives in module memory, which on a server would be shared across requests.
 */
type Fetcher = (url: string) => Promise<Pick<Response, "ok" | "json">>;

interface Entry { at: number; value: unknown }
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export const DEFAULT_TTL_MS = 30_000;

// The default is `any` on purpose: it is a drop-in for `fetch(url).then((r) => r.json())`, which is `any` too.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchJsonShared<T = any>(
  url: string,
  ttlMs: number = DEFAULT_TTL_MS,
  fetcher: Fetcher = (u) => fetch(u),
  now: () => number = Date.now,
): Promise<T> {
  const hit = cache.get(url);
  if (hit && now() - hit.at < ttlMs) return Promise.resolve(hit.value as T);
  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;

  const p = fetcher(url)
    .then(async (res) => {
      const value = (await res.json()) as T;
      if (res.ok) cache.set(url, { at: now(), value });
      return value;
    })
    .finally(() => {
      inflight.delete(url);
    });
  inflight.set(url, p);
  return p;
}

/** Forget one URL (or everything). Used after a write that changes what the endpoint returns, and by tests. */
export function clearSharedFetch(url?: string): void {
  if (url) {
    cache.delete(url);
    inflight.delete(url);
  } else {
    cache.clear();
    inflight.clear();
  }
}
