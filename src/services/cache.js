// Tiny localStorage cache with expiry, used to stay well inside the free APIs'
// rate limits and to show the last known data when you're offline at the bank.
const PREFIX = 'fishguide:cache:';

export function cacheGet(key, { allowStale = false } = {}) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { t, ttl, data } = JSON.parse(raw);
    const fresh = ttl === Infinity || ttl == null || Date.now() - t < ttl;
    if (fresh || allowStale) return { data, fetchedAt: t, stale: !fresh };
  } catch { /* ignore */ }
  return null;
}

export function cacheSet(key, data, ttlMs) {
  const write = () => localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), ttl: ttlMs, data }));
  try {
    write();
  } catch {
    // Storage full: drop old cache entries and try once more.
    Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
    try { write(); } catch { /* give up silently */ }
  }
}

// Fetch JSON with caching. On network failure returns stale cached data if any.
export async function cachedFetchJson(key, url, ttlMs) {
  const hit = cacheGet(key);
  if (hit) return hit;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    cacheSet(key, data, ttlMs);
    return { data, fetchedAt: Date.now(), stale: false };
  } catch (e) {
    const stale = cacheGet(key, { allowStale: true });
    if (stale) return { ...stale, stale: true };
    throw e;
  }
}
