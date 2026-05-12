import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", ".next-test/**", "node_modules/**", "out/**"],
  },
  {
    // LEDG-1717 / VULN-2075: forbid bare `rehype-raw` usage in `rehypePlugins`.
    // `rehype-raw` re-injects raw HTML embedded in markdown into the HAST tree
    // without sanitization. Whenever it is used, `rehype-sanitize` MUST run
    // after it (e.g. `rehypePlugins={[rehypeRaw, rehypeSanitize]}`) so the
    // raw HTML is filtered against the allow-list before being rendered.
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'JSXAttribute[name.name="rehypePlugins"] > JSXExpressionContainer > ArrayExpression:has(Identifier[name="rehypeRaw"]):not(:has(Identifier[name="rehypeSanitize"]))',
          message:
            "rehype-raw without rehype-sanitize is a stored-XSS sink (LEDG-1717). Stack [rehypeRaw, rehypeSanitize] so rehype-sanitize post-filters the raw HTML.",
        },
      ],
    },
  },
];

export default eslintConfig;
