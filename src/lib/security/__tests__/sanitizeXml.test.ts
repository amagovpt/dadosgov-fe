import { describe, expect, it } from "vitest";
import { sanitizeXml, XmlSanitizationError } from "../sanitizeXml";

describe("sanitizeXml", () => {
  it("rejects XML with script tags", () => {
    const payload =
      '<?xml version="1.0" encoding="UTF-8"?><root><script>alert(1)</script></root>';
    expect(() => sanitizeXml(payload)).toThrow(XmlSanitizationError);
  });

  it("rejects XML with event-handler attributes", () => {
    const payload =
      '<?xml version="1.0" encoding="UTF-8"?><root onclick="alert(1)"/>';
    expect(() => sanitizeXml(payload)).toThrow(XmlSanitizationError);
  });

  it("rejects XML with javascript: in href", () => {
    const payload =
      '<?xml version="1.0" encoding="UTF-8"?><root><a href="javascript:alert(1)"/></root>';
    expect(() => sanitizeXml(payload)).toThrow(XmlSanitizationError);
  });

  it("preserves benign XML", () => {
    const payload =
      '<?xml version="1.0" encoding="UTF-8"?><root><item id="1">Hello</item></root>';
    const cleaned = sanitizeXml(payload);
    expect(cleaned).toContain("Hello");
    expect(cleaned).toContain('id="1"');
  });

  it("rejects malformed XML", () => {
    expect(() => sanitizeXml("<root><broken>")).toThrow(XmlSanitizationError);
  });
});
