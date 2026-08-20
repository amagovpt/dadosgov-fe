import { NextRequest, NextResponse } from "next/server";

import { fetchTabularApi } from "../_lib/fetch-tabular-api";

/**
 * Tabular preview data proxy — given a resource UUID, relays one server-side
 * page of rows from the internal api-tabular service.
 *
 * Query params: rid (UUID), page, page_size, sort_by (column name),
 * sort_dir (asc|desc). The response passes through only {data, meta} —
 * upstream `links` are dropped because they embed the internal host.
 */

const PAGE_MAX = 10_000;
const PAGE_SIZE_MAX = 20;
const PAGE_SIZE_DEFAULT = 5;
const SORT_BY_MAX_LENGTH = 256;

// Column names are arbitrary source-file strings (spaces/accents legal), but
// control characters have no business in one.
const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/;

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const rid = params.get("rid");
  const page = clampInt(params.get("page"), 1, PAGE_MAX, 1);
  const pageSize = clampInt(params.get("page_size"), 1, PAGE_SIZE_MAX, PAGE_SIZE_DEFAULT);
  const sortBy = params.get("sort_by");
  const sortDir = params.get("sort_dir") === "desc" ? "desc" : "asc";

  // Build the upstream query by hand: the sort column travels as a query
  // *name* (`<col>__sort=asc`), and encodeURIComponent percent-encodes `&`,
  // `=` and spaces so a hostile column name cannot inject extra parameters.
  // (URLSearchParams is unsuitable here — it form-encodes spaces as `+`.)
  let query = `page=${page}&page_size=${pageSize}`;
  if (sortBy && sortBy.length <= SORT_BY_MAX_LENGTH && !CONTROL_CHARS_RE.test(sortBy)) {
    query += `&${encodeURIComponent(sortBy)}__sort=${sortDir}`;
  }

  const result = await fetchTabularApi(rid, "data", query, "proxy-tabular-data");

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { data, meta } = result.body as { data?: unknown; meta?: unknown };
  return NextResponse.json(
    { data: data ?? [], meta: meta ?? null },
    {
      status: 200,
      // Cached per full URL, so each page/sort combination caches correctly.
      headers: { "Cache-Control": "public, max-age=300" },
    }
  );
}
