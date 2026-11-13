const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d+$/;

/**
 * Turns a YouTube or Vimeo page URL into its embeddable player URL. Anything else returns
 * `null`: only these hosts are allowed by the CSP `frame-src`, so arbitrary URLs from the CMS
 * are never embedded. YouTube goes through the privacy-enhanced youtube-nocookie domain.
 */
export function toVideoEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const segments = url.pathname.split("/").filter(Boolean);

  let youtubeId: string | null = null;
  if (host === "youtu.be") {
    youtubeId = segments[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (segments[0] === "watch") youtubeId = url.searchParams.get("v");
    else if (["embed", "shorts", "live"].includes(segments[0])) youtubeId = segments[1] ?? null;
  }
  if (youtubeId) {
    return YOUTUBE_ID.test(youtubeId) ? `https://www.youtube-nocookie.com/embed/${youtubeId}` : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const vimeoId = segments.find((segment) => VIMEO_ID.test(segment));
    return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
  }

  return null;
}
