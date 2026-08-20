import { NextRequest, NextResponse } from "next/server";

import { fetchTabularApi } from "../_lib/fetch-tabular-api";

/**
 * Tabular preview profile proxy — given a resource UUID, relays the
 * csv-detective profile (column names + inferred types) from the internal
 * api-tabular service. Only the `profile` object is passed through.
 */

export async function GET(request: NextRequest) {
  const rid = request.nextUrl.searchParams.get("rid");

  const result = await fetchTabularApi(rid, "profile", "", "proxy-tabular-profile");

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { profile } = result.body as { profile?: unknown };
  return NextResponse.json(
    { profile: profile ?? null },
    {
      status: 200,
      headers: { "Cache-Control": "public, max-age=300" },
    }
  );
}
