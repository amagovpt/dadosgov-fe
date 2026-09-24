import { NextRequest, NextResponse } from "next/server";

import { fetchResourceBytes } from "../_lib/fetch-resource-bytes";

/**
 * CSV preview proxy — given a resource UUID, streams the resource bytes
 * through the backend catalogue resolver and serves them back as
 * `text/plain` for client-side tabular preview.
 *
 * The browser never supplies a URL, so there is no SSRF surface here; see
 * the `fetchResourceBytes` helper for the security model.
 */

const MAX_BYTES = 1_000_000; // 1 MiB cap on preview body

export async function GET(request: NextRequest) {
  const rid = request.nextUrl.searchParams.get("rid");

  const result = await fetchResourceBytes(request, rid, {
    maxBytes: MAX_BYTES,
    logLabel: "proxy-csv",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(result.bytes);
  } catch {
    text = new TextDecoder("windows-1252").decode(result.bytes);
  }

  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
