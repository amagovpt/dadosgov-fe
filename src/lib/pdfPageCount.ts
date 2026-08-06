import { getDocumentProxy } from "unpdf";

// The publications listing shows each PDF's page count, but the PDFs live in
// the CMS and are routinely larger than the 2 MB per-entry limit of Next's
// Data Cache — a `fetch(..., { cache: "force-cache" })` on the raw bytes
// silently degrades to re-downloading and re-parsing every listed PDF on each
// request. Cache the derived count (a number) here instead of the bytes.
//
// On the server this module is a long-lived singleton (same pattern as the
// Apollo CMS cache), so entries expire after a TTL to pick up assets replaced
// under the same slug. Failures are not cached: they cost one round-trip per
// request and recover as soon as the CMS does.
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  count: number;
  expiresAt: number;
}

const pageCountCache = new Map<string, CacheEntry>();

/**
 * Number of pages of the PDF at `url`, or `null` when the asset cannot be
 * fetched or parsed (callers render the card without a page count).
 */
export async function fetchPdfPageCount(url: string): Promise<number | null> {
  const cached = pageCountCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.count;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error(`[pdf-page-count] fetch ${url} returned ${res.status}`);
      return null;
    }

    const bytes = await res.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    pageCountCache.set(url, { count: pdf.numPages, expiresAt: Date.now() + CACHE_TTL_MS });
    return pdf.numPages;
  } catch (error) {
    console.error(`[pdf-page-count] fetch ${url} failed:`, error);
    return null;
  }
}
