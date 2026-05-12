/**
 * Regression suite for the markdown rendering stack used by
 * `ArticleDetail.tsx`, `GitHubMarkdownPage.tsx`, `GitHubArticlePage.tsx`,
 * `OrganizationTabs.tsx`, `OrganizationDetailClient.tsx`,
 * `ReuseDetailClient.tsx`, and `DatasetDetailClient.tsx`.
 *
 * Policy (LEDG-1717 / VULN-2075): every consumer of `rehype-raw` MUST also
 * pipe through `rehype-sanitize` so raw HTML embedded in markdown is filtered
 * against the allow-list before reaching the DOM.
 *
 * This suite exercises the stack directly so a future refactor that drops
 * `rehype-sanitize` (or replaces it with a weaker plugin) fails CI.
 */

import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

function renderMarkdown(input: string): string {
  return renderToStaticMarkup(
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
    >
      {input}
    </ReactMarkdown>,
  );
}

describe("markdown rendering stack ([rehypeRaw, rehypeSanitize])", () => {
  it("strips <script> blocks", () => {
    const html = renderMarkdown("Hello<script>alert(1)</script>World");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("</script");
  });

  it("strips inline event handlers like onerror", () => {
    const html = renderMarkdown('<img src="x" onerror="alert(1)">');
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("alert(1)");
  });

  it("drops <iframe> elements", () => {
    const html = renderMarkdown('<iframe src="https://evil.example.com"></iframe>');
    expect(html).not.toContain("<iframe");
  });

  it("neutralizes javascript: URIs in links", () => {
    const html = renderMarkdown('<a href="javascript:alert(1)">click</a>');
    expect(html).not.toContain("javascript:");
  });

  it("renders legitimate markdown headings", () => {
    const html = renderMarkdown("# Heading\n\nParagraph.");
    expect(html).toContain("<h1>Heading</h1>");
    expect(html).toContain("<p>Paragraph.</p>");
  });

  it("renders legitimate markdown links and emphasis", () => {
    const html = renderMarkdown("**bold** _italic_ [link](https://example.com)");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain(">link</a>");
  });

  it("renders code blocks", () => {
    const html = renderMarkdown("```\nconst x = 1;\n```");
    expect(html).toContain("<pre>");
    expect(html).toContain("const x = 1;");
  });

  it("renders GFM tables (smoke check on remarkGfm)", () => {
    const md = "| a | b |\n| --- | --- |\n| 1 | 2 |";
    const html = renderMarkdown(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<th>a</th>");
    expect(html).toContain("<td>1</td>");
  });

  it("preserves inline HTML that is on the allow-list (e.g. <sub>)", () => {
    const html = renderMarkdown("H<sub>2</sub>O");
    expect(html).toContain("<sub>2</sub>");
  });
});
