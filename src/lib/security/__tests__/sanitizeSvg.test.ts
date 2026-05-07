import { describe, expect, it } from "vitest";
import { sanitizeSvg, SvgSanitizationError } from "../sanitizeSvg";
import { MAX_SVG_SIZE } from "../constants";

describe("sanitizeSvg", () => {
  it("removes script tags", () => {
    const cleaned = sanitizeSvg("<svg><script>alert(1)</script></svg>");
    expect(cleaned).not.toContain("script");
    expect(cleaned).not.toContain("alert");
  });

  it("removes onload event handlers", () => {
    const cleaned = sanitizeSvg('<svg onload="alert(1)"></svg>');
    expect(cleaned).not.toContain("onload");
  });

  it("rejects malformed SVG", () => {
    expect(() => sanitizeSvg('<svg onload="alert(1)">')).toThrow(SvgSanitizationError);
  });

  it("removes javascript: hrefs", () => {
    const cleaned = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)">Click me</a></svg>',
    );
    expect(cleaned).not.toContain("javascript:");
    expect(cleaned).toContain("Click me");
  });

  it("removes namespaced script tags", () => {
    const cleaned = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    expect(cleaned).not.toContain("script");
  });

  it("preserves valid SVG", () => {
    const cleaned = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" /></svg>',
    );
    expect(cleaned).toContain("circle");
    expect(cleaned).toContain('fill="yellow"');
    expect(cleaned.startsWith("<?xml")).toBe(true);
  });

  it("removes foreignObject elements", () => {
    const cleaned = sanitizeSvg(
      "<svg><foreignObject><div>x</div></foreignObject></svg>",
    );
    expect(cleaned).not.toContain("foreignObject");
  });

  it("rejects non-SVG root elements", () => {
    expect(() => sanitizeSvg("<html><body>Not an SVG</body></html>")).toThrow(
      /SVG válido/,
    );
  });

  it("detects javascript: via HTML entity obfuscation", () => {
    const cleaned = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="&#106;avascript:alert(1)">Click</a></svg>',
    );
    expect(cleaned).not.toContain("href");
  });

  it("detects URL-encoded dangerous URIs", () => {
    const cleaned = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="%6aavascript:alert(1)">Click</a></svg>',
    );
    expect(cleaned).not.toContain("href");
  });

  it("removes vbscript: URIs", () => {
    const cleaned = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="vbscript:msgbox(1)">Click</a></svg>',
    );
    expect(cleaned).not.toContain("vbscript:");
  });

  it("removes data: URIs", () => {
    const cleaned = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="data:text/html,alert">Click</a></svg>',
    );
    expect(cleaned).not.toContain("data:");
  });

  it("rejects oversized SVGs", () => {
    const oversized = "<svg>" + "x".repeat(MAX_SVG_SIZE + 1) + "</svg>";
    expect(() => sanitizeSvg(oversized)).toThrow(/demasiado grande/);
  });

  it("removes multiple event handlers", () => {
    const cleaned = sanitizeSvg(
      '<svg onclick="alert(1)" onload="alert(2)" onmouseover="alert(3)"></svg>',
    );
    expect(cleaned).not.toContain("onclick");
    expect(cleaned).not.toContain("onload");
    expect(cleaned).not.toContain("onmouseover");
  });

  it("removes action attributes with dangerous URIs", () => {
    const cleaned = sanitizeSvg(
      '<svg><form action="javascript:alert(1)"></form></svg>',
    );
    expect(cleaned).not.toContain("javascript:");
  });

  it("removes xlink:href with dangerous URI", () => {
    const cleaned = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="javascript:alert(1)">x</a></svg>',
    );
    expect(cleaned).not.toContain("javascript:");
  });
});
