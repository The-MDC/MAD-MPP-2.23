type Json = Record<string, unknown>;

function config() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function command<T>(parts: string[]): Promise<T | null> {
  const client = config();
  if (!client) return null;
  try {
    const response = await fetch(`${client.url}/${parts.map(encodeURIComponent).join("/")}`, {
      headers: { Authorization: `Bearer ${client.token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json() as { result: T }).result;
  } catch {
    return null;
  }
}

/** Best-effort server cache. Redis failures never fail the request path. */
export async function getCachedJson<T extends Json>(key: string): Promise<T | null> {
  const value = await command<string | null>(["get", key]);
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

export async function setCachedJson(key: string, value: Json, ttlSeconds: number): Promise<void> {
  await command<unknown>(["set", key, JSON.stringify(value), "EX", String(ttlSeconds)]);
}
