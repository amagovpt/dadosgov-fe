import { NextRequest, NextResponse } from "next/server";

import { fetchAllowedResource } from "../_lib/fetch-allowed-resource";

/**
 * CSV preview proxy — fetches the CSV body of a community/dataset resource on
 * behalf of the browser and serves it back as `text/plain` for client-side
 * tabular preview.
 *
 * The SSRF hardening (allowlist, DNS pinning, size cap, content-type
 * allowlist, redirect refusal — TICKET-60 / VULN-2079) lives in the shared
 * `fetchAllowedResource` helper, which the spreadsheet proxy reuses too.
 */

const MAX_BYTES = 1_000_000; // 1 MiB cap on preview body

// Loose allowlist of upstream Content-Type prefixes. We accept
// application/octet-stream because some servers serve plain CSV with a
// generic binary type; the body is still treated as text and capped.
const ALLOWED_CONTENT_TYPE_PREFIXES = [
  "text/csv",
  "text/plain",
  "text/tab-separated-values",
  "application/csv",
  "application/octet-stream",
  "application/vnd.ms-excel",
];

export async function GET(request: NextRequest) {
  const requesterIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  const rawUrl = request.nextUrl.searchParams.get("url");

  const result = await fetchAllowedResource(rawUrl, {
    allowedContentTypePrefixes: ALLOWED_CONTENT_TYPE_PREFIXES,
    maxBytes: MAX_BYTES,
    accept: "text/csv, text/plain, */*",
    requesterIp,
    logLabel: "proxy-csv",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, ...result.extra }, { status: result.status });
  }

  const text = new TextDecoder("utf-8").decode(result.bytes);

  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
