const PROBE_TIMEOUT_MS = 1500;

async function isReachable(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      next: { revalidate: 60 },
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export async function probeUrls(
  urls: (string | null | undefined)[]
): Promise<Set<string>> {
  const unique = Array.from(new Set(urls.filter((u): u is string => !!u)));
  const results = await Promise.all(
    unique.map(async (u) => [u, await isReachable(u)] as const)
  );
  return new Set(results.filter(([, ok]) => ok).map(([u]) => u));
}
