import { githubPagesConfig } from "@/config/site";

/**
 * Fetches markdown content from GitHub with Next.js ISR caching.
 * Revalidates every 5 minutes so pages load instantly from cache.
 */
export async function fetchGitHubMarkdown(slug: string): Promise<string> {
  const url = `${githubPagesConfig.rawBaseUrl}/${slug}.md`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  } catch (error) {
    console.error("Failed to fetch markdown content:", error);
    return "";
  }
}
