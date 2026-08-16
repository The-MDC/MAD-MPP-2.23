"use client";

import { useCallback, useEffect, useState } from "react";

export type ApiState<T> = { data: T | null; loading: boolean; error: string | null; reload: () => void };

/** Fetches a JSON route with explicit loading, error, and retry state. */
export function useApi<T>(path: string): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    fetch(path)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json() as Promise<T>;
      })
      .then((value) => { if (active) setData(value); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Request failed"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, revision]);

  return { data, loading, error, reload };
}
