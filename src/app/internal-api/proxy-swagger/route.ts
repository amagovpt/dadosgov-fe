import { NextRequest, NextResponse } from "next/server";

import { fetchRemoteJson } from "../_lib/fetch-remote-json";
import { parseOpenApi } from "@/utils/parseOpenApi";

/**
 * Swagger/OpenAPI spec proxy — fetches the JSON document at the dataservice's
 * `machine_documentation_url` server-side, avoiding the browser CORS/mixed-
 * content restrictions. The URL is browser-supplied, so the fetch is guarded
 * against SSRF in `fetchRemoteJson` (scheme + private-IP + redirect checks).
 */

const MAX_BYTES = 3_000_000; // 3 MiB cap on a spec document

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  const result = await fetchRemoteJson(url, { maxBytes: MAX_BYTES, logLabel: "proxy-swagger" });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // The detail page only renders a summary. Avoid transferring schemas and
  // operation parameters it will discard, especially on slow connections.
  const data = request.nextUrl.searchParams.get("format") === "summary"
    ? parseOpenApi(result.data)
    : result.data;
  if (data === null) {
    return NextResponse.json({ error: "Not a supported OpenAPI document" }, { status: 415 });
  }

  return NextResponse.json(data, {
    status: 200,
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
