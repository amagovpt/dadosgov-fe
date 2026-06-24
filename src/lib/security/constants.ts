// General upload ceiling applied to every resource file. Binary files are not
// read into memory client-side (only the first 1KB is sniffed), so this can be
// large without risking the browser tab.
export const MAX_UPLOAD_SIZE = 800 * 1024 * 1024;

// SVG and XML are read *fully* into memory as a string to be sanitized, so they
// keep tighter caps to avoid blowing up the tab on a multi-hundred-MB text read.
export const MAX_SVG_SIZE = 5 * 1024 * 1024;

export const MAX_XML_SIZE = 100 * 1024 * 1024;

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
