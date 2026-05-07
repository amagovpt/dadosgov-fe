export const MAX_SVG_SIZE = 5 * 1024 * 1024;

export const MAX_XML_SIZE = 50 * 1024 * 1024;

export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export const FORBIDDEN_TAGS = new Set([
  "script",
  "foreignobject",
  "iframe",
  "object",
  "embed",
  "applet",
  "meta",
  "link",
]);

export const EVENT_ATTRIBUTE_REGEX = /^on[a-z]+/i;

export const URI_ATTRIBUTES = new Set([
  "href",
  "xlink:href",
  "src",
  "action",
  "formaction",
]);
