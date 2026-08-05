"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import type { ApiReferencePage } from "@/service/types/documentation/api-reference";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

declare global {
  interface Window {
    SwaggerUIBundle?: (config: Record<string, unknown>) => void;
  }
}

// The API root serves the backend's standalone Swagger UI (Flask-RestX). Both
// URLs are same-origin: `/api/` is forwarded to the backend by the Next proxy
// (see `src/proxy.ts`), which keeps the `download` attribute working.
const SWAGGER_UI_URL = "/api/1/";
const SWAGGER_JSON_URL = "/api/1/swagger.json";
const SWAGGER_JSON_FILENAME = "dados-gov-api-swagger.json";
const SWAGGER_CSS_ID = "swagger-ui-css";
const SWAGGER_SCRIPT_ID = "swagger-ui-script";

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-16 text-m-regular leading-7 text-[#2b363c]">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-[#034AD8] underline hover:text-primary-700"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-16 list-disc space-y-8 pl-24 text-m-regular leading-7">{children}</ul>,
  ol: ({ children }) => <ol className="mb-16 list-decimal space-y-8 pl-24 text-m-regular leading-7">{children}</ol>,
  pre: ({ children }) => (
    <pre className="mb-16 overflow-x-auto rounded-lg bg-[#1e1e1e] p-24 text-s-regular leading-[22px] text-[#d4d4d4]">
      {children}
    </pre>
  ),
  code: ({ children, className }) =>
    className?.includes("language-") ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-[#e1e4ea] px-6 py-2 font-mono text-s-regular">{children}</code>
    ),
};

export default function ApiTutorialClient({ page }: { page: ApiReferencePage }) {
  const swaggerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("documentation");

  useEffect(() => {
    let cancelled = false;

    // Add CSS if not already present
    if (!document.getElementById(SWAGGER_CSS_ID)) {
      const swaggerUiCss = document.createElement("link");
      swaggerUiCss.id = SWAGGER_CSS_ID;
      swaggerUiCss.rel = "stylesheet";
      swaggerUiCss.href =
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css";
      document.head.appendChild(swaggerUiCss);
    }

    async function initSwagger() {
      if (cancelled || !swaggerRef.current) return;
      if (!window.SwaggerUIBundle) return;

      swaggerRef.current.replaceChildren();

      // Fetch the spec and strip the absolute `host` so that requests go to
      // the current origin (via the Next.js /api proxy in dev, same-origin in
      // prod). Avoids CORS errors when the portal and backend run on
      // different ports in development.
      let spec: Record<string, unknown> | undefined;
      try {
        const res = await fetch(SWAGGER_JSON_URL);
        if (res.ok) {
          spec = await res.json();
          if (spec) {
            delete spec.host;
            spec.basePath = "/api/1";
            spec.schemes = [window.location.protocol.replace(":", "")];
          }
        }
      } catch {
        // Fall back to url-based loading below
      }

      if (cancelled || !swaggerRef.current) return;

      window.SwaggerUIBundle({
        ...(spec ? { spec } : { url: SWAGGER_JSON_URL }),
        domNode: swaggerRef.current,
        docExpansion: "none",
        deepLinking: false,
        layout: "BaseLayout",
      });
    }

    // A client-side navigation can mount this component while a previous
    // mount is still loading Swagger's script. In that case the element
    // exists but the global is not ready yet, so wait for its load event.
    const existingScript = document.getElementById(SWAGGER_SCRIPT_ID) as HTMLScriptElement | null;
    const handleScriptLoad = () => {
      void initSwagger();
    };

    if (window.SwaggerUIBundle) {
      void initSwagger();
    } else if (existingScript) {
      existingScript.addEventListener("load", handleScriptLoad, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = SWAGGER_SCRIPT_ID;
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js";
      script.addEventListener("load", handleScriptLoad, { once: true });
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      existingScript?.removeEventListener("load", handleScriptLoad);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <main className="flex-grow pb-64 pt-32">
        <div className="container mx-auto px-4">
          <div className="mb-64 pt-32">
            <BreadcrumbDynamic darkMode={false} />
          </div>

          <h1 className="mb-32 max-w-[800px] text-2xl-medium leading-tight text-[#021C51]">{page.hero.title}</h1>

          <div className="mb-48 max-w-[800px]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={markdownComponents}
            >
              {page.hero.description}
            </ReactMarkdown>
          </div>
        </div>

        <div className="bg-[#F7F8FA] pb-64 pt-64">
          <div className="container mx-auto px-4">
            <div className="max-w-[800px]">
              {page.sections
                .filter((section) => section.enabled !== false)
                .map((section) => (
                  <section key={section.id} id={section.id} className="mb-48">
                    <h2 className="mb-16 text-[20px] font-bold text-[#021C51]">{section.title}</h2>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={markdownComponents}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </section>
                ))}
              <div className="mb-24 flex flex-wrap items-center gap-24">
                <a
                  href={SWAGGER_UI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-8 text-primary-600 hover:underline"
                >
                  <Icon name="agora-line-external-link" className="h-6 w-6" />
                  <span>{t("apiReference.openSwagger")}</span>
                </a>
                <a
                  href={SWAGGER_JSON_URL}
                  download={SWAGGER_JSON_FILENAME}
                  className="inline-flex items-center gap-8 text-primary-600 hover:underline"
                >
                  <Icon name="agora-line-download" className="h-6 w-6" />
                  <span>{t("apiReference.downloadSpecification")}</span>
                </a>
              </div>
            </div>

            {/* Swagger UI */}
            <div
              ref={swaggerRef}
              className="swagger-ui-container rounded-lg shadow-sm bg-white p-16"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
