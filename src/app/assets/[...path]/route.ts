import { NextRequest, NextResponse } from "next/server";
import { getCmsBaseUrl } from "@/service/utils/cmsBaseUrl";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const assetPath = path.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${getCmsBaseUrl()}/api/assets/${assetPath}${search}`;

  try {
    // Deadline so a hung CMS turns into a fast 502 (caught below) instead of
    // holding the connection open until the F5 time limit. 10s covers large
    // assets; the signal also aborts a body stream that stalls mid-transfer.
    const response = await fetch(targetUrl, {
      cache: "no-cache",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`[assets proxy] ${targetUrl} returned ${response.status}`);
      return new NextResponse(null, { status: response.status });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(`[assets proxy] failed to fetch ${targetUrl}:`, error);
    return new NextResponse(null, { status: 502 });
  }
}
