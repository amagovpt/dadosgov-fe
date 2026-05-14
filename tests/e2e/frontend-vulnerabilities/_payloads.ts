/**
 * Reusable XSS payload bag. Each payload is engineered to be detectable
 * post-render without relying on alert() dialogs, which the headless browser
 * auto-dismisses on some Playwright versions and which only one of these
 * vectors actually triggers.
 *
 * The detection contract is uniform: every successful execution sets a flag
 * on `window.__xssFlags[<key>]`. Specs read that object back via
 * `page.evaluate` and assert every flag is undefined. We do not rely on
 * substring checks against the HTML alone because react-markdown + rehype
 * may legitimately keep the literal `<script>` text as inert content —
 * what matters is whether code ran.
 */

export interface XssPayload {
  key: string;
  payload: string;
  description: string;
}

export const XSS_PAYLOADS: XssPayload[] = [
  {
    key: "imgOnError",
    payload: '<img src=x onerror="window.__xssFlags = (window.__xssFlags || {}); window.__xssFlags.imgOnError = 1">',
    description: "img tag with onerror handler (VULN-2075 PoC vector)",
  },
  {
    key: "scriptTag",
    payload: "<script>window.__xssFlags = (window.__xssFlags || {}); window.__xssFlags.scriptTag = 1;</script>",
    description: "raw <script> tag",
  },
  {
    key: "svgOnLoad",
    payload: '<svg onload="window.__xssFlags = (window.__xssFlags || {}); window.__xssFlags.svgOnLoad = 1"></svg>',
    description: "svg with onload handler",
  },
  {
    key: "javascriptLink",
    payload:
      "[click-here](javascript:window.__xssFlags = (window.__xssFlags || {}); window.__xssFlags.javascriptLink = 1)",
    description: "markdown link with javascript: protocol",
  },
  {
    key: "iframeSrcDoc",
    payload:
      '<iframe srcdoc="<script>parent.__xssFlags = (parent.__xssFlags || {}); parent.__xssFlags.iframeSrcDoc = 1;</script>"></iframe>',
    description: "iframe with inline srcdoc executing in parent context",
  },
];

/**
 * Concatenate every payload into a single string so a test only needs one
 * intercept to cover every vector. Markdown line breaks separate them so a
 * markdown renderer treats each as a separate block.
 */
export const COMBINED_XSS_PAYLOAD = XSS_PAYLOADS.map((p) => p.payload).join("\n\n");

/**
 * Initialised in every test's `addInitScript` so `window.__xssFlags`
 * exists before any user code (legitimate or otherwise) runs. Keeps the
 * post-render assertion shape uniform.
 */
export const INIT_XSS_FLAGS = `window.__xssFlags = {};`;

/**
 * Convenience type for the shape we read back from `page.evaluate`.
 */
export type XssFlags = Partial<Record<(typeof XSS_PAYLOADS)[number]["key"], number>>;
