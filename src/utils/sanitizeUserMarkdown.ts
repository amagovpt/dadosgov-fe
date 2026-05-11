/**
 * Defense-in-depth sanitization for user-supplied markdown/HTML strings
 * (organization / dataset / reuse descriptions, reuse title, etc.) that are
 * rendered via `react-markdown`.
 *
 * The renderer already pipes through `rehype-raw + rehype-sanitize` so any
 * dangerous *element* or *attribute* is stripped at render time. This helper
 * adds two extra guarantees that the rendered DOM (and the RSC hydration
 * payload it ends up in) never contains attack-shaped substrings:
 *
 *   • Drops `<script>` and `<iframe>` blocks before they reach the markdown
 *     parser. `rehype-sanitize` already removes them, but pre-stripping
 *     avoids leaking their bodies as text in degenerate markdown contexts.
 *   • Neutralizes `javascript:`, `data:`, and `vbscript:` URI schemes — both
 *     inside HTML attributes and inside markdown link destinations. The
 *     markdown parser doesn't always recognize bracketed-link syntax when
 *     surrounded by HTML blocks, which means a payload like
 *     `[click-here](javascript:...)` can fall through as literal text and
 *     keep the dangerous substring in the DOM.
 *
 * This is *not* a replacement for the backend `pre_save` sanitizer — it is a
 * frontend safety net for the worst case where a malformed record reaches
 * the renderer (e.g. data written via `update_one` that bypassed the model
 * hooks).
 */
export function sanitizeUserMarkdown(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\ssrcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\b(?:javascript|data|vbscript)\s*:/gi, "");
}
