import { NextRequest, NextResponse } from "next/server";

const BE_CMS_URL = process.env.NEXT_PUBLIC_API_URL;


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const assetPath = path.join("/");
  const search = request.nextUrl.search;

  const targetUrl = `${BE_CMS_URL}/api/assets/${assetPath}${search}`;

  try {
    const response = await fetch(targetUrl, { cache: "force-cache" });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
