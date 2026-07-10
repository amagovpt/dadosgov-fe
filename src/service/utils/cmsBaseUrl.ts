// Server-side (Node, inside container) prefers API_URL_INTERNAL, a plain
// runtime env var. Client-side (browser) only sees NEXT_PUBLIC_API_URL,
// which is baked in at `docker build` time and can't be corrected at
// container runtime.
export function getCmsBaseUrl(): string {
  const rawUrl =
    (typeof window === "undefined" && process.env.API_URL_INTERNAL) ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3333";
  return rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
}
