import * as cheerio from "cheerio";

export function parseHtmlToParagraphs(html?: string): string[] {
  if (!html) return [];
  const $ = cheerio.load(html);

  // Preserve line breaks
  $("br").replaceWith("\n");

  const pElems = $("p");
  if (pElems.length > 0) {
    return pElems
      .map((_, el) => {
        const text = $(el).text().replace(/\r/g, "");
        return text
          .split("\n")
          .map((s) => s.replace(/\s+/g, " ").trim())
          .join("\n")
          .trim();
      })
      .get()
      .filter(Boolean);
  }

  // Fallback: extract document text and split into paragraphs by blank lines
  const fullText = $.root().text().replace(/\r/g, "");
  const normalized = fullText
    .split("\n")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .join("\n");
  return normalized
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function stripHtmlTags(html?: string | null): string {
  if (!html) return "";
  let s = html;

  // preserve meaningful breaks
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/?h[1-6][^>]*>/gi, "\n");

  // remove remaining tags
  s = s.replace(/<[^>]*>/g, "");

  // normalize whitespace and multiple newlines
  s = s.replace(/\n{2,}/g, "\n").replace(/[ \t]{2,}/g, " ").trim();

  return s;
}
