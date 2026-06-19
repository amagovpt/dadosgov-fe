import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "../backend-fetch";

export async function GET(_request: NextRequest) {
    try {
        // Use the dedicated /get-csrf endpoint (no rate limit, unlike GET /login/)
        const backendResponse = await backendFetch("/get-csrf", {
            cache: "no-store",
        });

        if (!backendResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch CSRF token" }, { status: 500 });
        }

        const data = await backendResponse.json();
        const csrfToken = data?.response?.csrf_token;

        if (!csrfToken) {
            return NextResponse.json({ error: "Could not find CSRF token" }, { status: 500 });
        }

        const response = NextResponse.json({ csrf_token: csrfToken });

        // Forward the Set-Cookie headers from backend, stripping Domain
        const setCookies = backendResponse.headers.getSetCookie();
        for (const cookie of setCookies) {
            const cleaned = cookie.replace(/;\s*Domain=[^;]*/i, "");
            response.headers.append("Set-Cookie", cleaned);
        }

        return response;
    } catch (error) {
        console.error("Error fetching CSRF token:", error);
        return NextResponse.json({ error: "Failed to fetch CSRF token" }, { status: 500 });
    }
}
