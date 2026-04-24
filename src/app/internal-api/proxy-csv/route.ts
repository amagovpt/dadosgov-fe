import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_HOSTS = ["dados.gov.pt", "preprod.dados.gov.pt"];
const MAX_BYTES = 1_000_000; // 1MB limit for preview
const FETCH_TIMEOUT_MS = 10_000;

function parseAllowedHosts(): Set<string> {
  const raw = process.env.CSV_PROXY_ALLOWED_HOSTS;
  const hosts = raw
    ? raw.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_ALLOWED_HOSTS;
  return new Set(hosts);
}

function allowedProtocols(): Set<string> {
  const allowHttp = process.env.CSV_PROXY_ALLOW_HTTP === "true";
  return allowHttp ? new Set(["https:", "http:"]) : new Set(["https:"]);
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const allowedHosts = parseAllowedHosts();
  const protocols = allowedProtocols();
  const host = target.host.toLowerCase();
  const hostname = target.hostname.toLowerCase();

  const hostMatches = allowedHosts.has(host) || allowedHosts.has(hostname);
  if (!protocols.has(target.protocol) || !hostMatches) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(target, {
      headers: { Accept: "text/csv, text/plain, */*" },
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status }
      );
    }

    const buffer = await res.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(buffer.slice(0, MAX_BYTES));

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("Proxy CSV error:", err);
    return NextResponse.json({ error: "Failed to fetch resource" }, { status: 502 });
  }
}
