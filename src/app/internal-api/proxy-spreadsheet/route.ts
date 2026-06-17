import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { fetchAllowedResource, logProxyEvent } from "../_lib/fetch-allowed-resource";

/**
 * Spreadsheet preview proxy — fetches an .xls / .xlsx / .ods resource on
 * behalf of the browser, parses the first worksheet server-side with SheetJS,
 * and returns a small JSON preview (headers + sample rows + totals).
 *
 * Parsing happens on the server so the binary parser never ships to the
 * client, and the same SSRF hardening as the CSV proxy applies via the shared
 * `fetchAllowedResource` helper (allowlist, DNS pinning, size cap, content-type
 * allowlist, redirect refusal — TICKET-60 / VULN-2079).
 */

// Spreadsheets are binary archives, so allow a larger body than the CSV proxy.
// A truncated archive would fail to parse, so we surface a friendly error
// rather than rendering a partial table.
const MAX_BYTES = 5_000_000; // 5 MiB
const MAX_SAMPLE_ROWS = 100; // rows returned for preview + type detection

const ALLOWED_CONTENT_TYPE_PREFIXES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "application/vnd.oasis.opendocument.spreadsheet", // .ods
  "application/octet-stream",
  "application/zip", // .xlsx is a zip container; some servers report this
  "application/x-zip-compressed",
];

/** Normalize a SheetJS cell value to a trimmed string for the preview. */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

export async function GET(request: NextRequest) {
  const requesterIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  const rawUrl = request.nextUrl.searchParams.get("url");

  const result = await fetchAllowedResource(rawUrl, {
    allowedContentTypePrefixes: ALLOWED_CONTENT_TYPE_PREFIXES,
    maxBytes: MAX_BYTES,
    accept:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, */*",
    // dados.gov.pt storage serves files with `nosniff` and no content-type;
    // SheetJS validates the bytes and we reject non-spreadsheets with 422.
    allowMissingContentType: true,
    requesterIp,
    logLabel: "proxy-spreadsheet",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, ...result.extra }, { status: result.status });
  }

  // A spreadsheet that hit the size cap is almost certainly truncated, and a
  // truncated binary archive cannot be parsed reliably — bail out cleanly.
  if (result.total >= MAX_BYTES) {
    return NextResponse.json(
      { error: "Ficheiro demasiado grande para pré-visualização" },
      { status: 413 }
    );
  }

  let headers: string[];
  let rows: string[][];
  let totalRows: number;
  try {
    const workbook = XLSX.read(result.bytes, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: "Ficheiro sem folhas de cálculo" }, { status: 422 });
    }
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });

    if (matrix.length === 0) {
      return NextResponse.json({ error: "Folha de cálculo vazia" }, { status: 422 });
    }

    headers = matrix[0].map(cellToString);
    const dataRows = matrix.slice(1);
    totalRows = dataRows.length;
    rows = dataRows.slice(0, MAX_SAMPLE_ROWS).map((row) => headers.map((_, i) => cellToString(row[i])));
  } catch (err) {
    logProxyEvent("proxy-spreadsheet", {
      level: "warn",
      ip: requesterIp,
      status: 422,
      reason: "parse-failed",
      detail: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Não foi possível interpretar a folha de cálculo" },
      { status: 422 }
    );
  }

  return NextResponse.json(
    {
      headers,
      rows,
      totalRows,
      totalCols: headers.length,
      lastModified: result.lastModified,
    },
    {
      status: 200,
      headers: { "Cache-Control": "public, max-age=300" },
    }
  );
}
