"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@ama-pt/agora-design-system";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";

declare global {
  interface Window {
    SwaggerUIBundle?: (config: Record<string, unknown>) => void;
  }
}

const SWAGGER_JSON_URL = "/api/1/swagger.json";
// The API root serves the backend's standalone Swagger UI (Flask-RestX). Both
// URLs are same-origin: `/api/` is forwarded to the backend by the Next proxy
// (see `src/proxy.ts`), which keeps the `download` attribute working.
const SWAGGER_UI_URL = "/api/1/";
const SWAGGER_JSON_FILENAME = "dados-gov-api-swagger.json";
const SWAGGER_CSS_ID = "swagger-ui-css";
const SWAGGER_SCRIPT_ID = "swagger-ui-script";

export default function ApiTutorialClient() {
  const swaggerRef = useRef<HTMLDivElement>(null);

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

    // Load script if not already present
    const existingScript = document.getElementById(SWAGGER_SCRIPT_ID);
    if (existingScript) {
      initSwagger();
    } else {
      const script = document.createElement("script");
      script.id = SWAGGER_SCRIPT_ID;
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js";
      script.onload = initSwagger;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <main className="flex-grow pb-64 pt-32">
        <div className="container mx-auto px-4">
          <div className="mb-64 pt-32">
            <BreadcrumbDynamic darkMode={false} />
          </div>

          <h1 className="mb-32 max-w-[800px] text-2xl-medium leading-tight text-[#021C51]">
            Referência API
          </h1>

          <p className="mb-48 max-w-[800px] text-m-regular leading-7 text-[#2b363c]">
            Esta página descreve o comportamento da API RESTful aberta e gratuita do dados.gov.pt.
          </p>
        </div>

        <div className="bg-[#F7F8FA] pb-64 pt-64">
          <div className="container mx-auto px-4">
            <div className="max-w-[800px]">
              {/* Autenticação */}
              <section className="mb-48">
                <h2 className="mb-16 text-[20px] font-bold text-[#021C51]">Autenticação</h2>
                <p className="mb-16 text-m-regular leading-7 text-[#2b363c]">
                  Para poder executar operações de escrita, é necessário obter uma Chave de API nas
                  definições do seu perfil.
                </p>
                <p className="text-m-regular leading-7 text-[#2b363c]">
                  Esta chave deve ser fornecida em cada chamada no cabeçalho HTTP{" "}
                  <code className="rounded font-mono bg-[#e1e4ea] px-6 py-2 text-s-regular">
                    X-API-KEY
                  </code>
                  .
                </p>
              </section>

              {/* Autorizações */}
              <section className="mb-48">
                <h2 className="mb-16 text-[20px] font-bold text-[#021C51]">Autorizações</h2>
                <p className="mb-16 text-m-regular leading-7 text-[#2b363c]">
                  As chamadas à API estão sujeitas às mesmas permissões que a interface web.
                </p>
                <p className="text-m-regular leading-7 text-[#2b363c]">
                  Por exemplo, é necessário fazer parte de uma organização para modificar um dos
                  seus conjuntos de dados.
                </p>
              </section>

              {/* Paginação */}
              <section className="mb-48">
                <h2 className="mb-16 text-[20px] font-bold text-[#021C51]">Paginação</h2>
                <p className="mb-16 text-m-regular leading-7 text-[#2b363c]">
                  Alguns métodos são paginados e seguem sempre o mesmo padrão. A lista de objetos é
                  encapsulada num objeto{" "}
                  <code className="rounded font-mono bg-[#e1e4ea] px-6 py-2 text-s-regular">
                    Page
                  </code>
                  .
                </p>
                <p className="mb-16 text-m-regular leading-7 text-[#2b363c]">
                  Não é necessário calcular as páginas anterior e seguinte, pois os URLs estão
                  disponíveis na resposta nos atributos{" "}
                  <code className="rounded font-mono bg-[#e1e4ea] px-6 py-2 text-s-regular">
                    previous_page
                  </code>{" "}
                  e{" "}
                  <code className="rounded font-mono bg-[#e1e4ea] px-6 py-2 text-s-regular">
                    next_page
                  </code>
                  . Estes serão definidos como{" "}
                  <code className="rounded font-mono bg-[#e1e4ea] px-6 py-2 text-s-regular">
                    null
                  </code>{" "}
                  se não existir página anterior e/ou seguinte.
                </p>
                <p className="mb-8 text-m-regular leading-7 text-[#2b363c]">
                  <u>Exemplo</u>:
                </p>
                <pre className="rounded-lg font-mono overflow-x-auto bg-[#1e1e1e] p-24 text-s-regular leading-[22px] text-[#d4d4d4]">
                  <code>
                    {JSON.stringify(
                      {
                        data: ["{...}", "{...}"],
                        page: 1,
                        page_size: 20,
                        total: 10,
                        next_page: "https://dados.gov.pt/api/1/endpoint/?page=2",
                        previous_page: null,
                      },
                      null,
                      2
                    )}
                  </code>
                </pre>
              </section>

              {/* Referência */}
              <section>
                <h2 className="mb-16 text-[20px] font-bold text-[#021C51]">Referência</h2>
                <p className="mb-16 text-m-regular leading-7 text-[#2b363c]">
                  Explore os endpoints disponíveis na documentação interativa abaixo, abra-a no
                  Swagger UI ou descarregue a especificação OpenAPI para a utilizar nas suas
                  ferramentas.
                </p>
                <div className="mb-24 flex flex-wrap items-center gap-24">
                  <a
                    href={SWAGGER_UI_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-8 text-primary-600 hover:underline"
                  >
                    <Icon name="agora-line-external-link" className="w-6 h-6" />
                    <span>Abrir no Swagger UI</span>
                  </a>
                  <a
                    href={SWAGGER_JSON_URL}
                    download={SWAGGER_JSON_FILENAME}
                    className="inline-flex items-center gap-8 text-primary-600 hover:underline"
                  >
                    <Icon name="agora-line-download" className="w-6 h-6" />
                    <span>Descarregar especificação (JSON)</span>
                  </a>
                </div>
              </section>
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
