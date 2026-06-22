"use client";

import { useEffect, useRef } from "react";
import { Breadcrumb } from "@ama-pt/agora-design-system";

const SWAGGER_JSON_URL = "/api/1/swagger.json";
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
      if (!(window as any).SwaggerUIBundle) return;

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

      (window as any).SwaggerUIBundle({
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
    <div className="flex flex-col bg-white min-h-screen font-sans">
      <main className="flex-grow pt-32 pb-64">
        <div className="container mx-auto px-4">
          <div className="pt-32 mb-64">
            <Breadcrumb
              items={[
                { label: "Home", url: "/" },
                { label: "Recursos", url: "#" },
                { label: "Desenvolvimento", url: "#" },
                { label: "Referência API", url: "/pages/faqs/api-documentation" },
              ]}
            />
          </div>

          <h1 className="text-2xl-medium text-[#021C51] mb-32 leading-tight max-w-[800px]">
            Referência API
          </h1>

          <p className="text-m-regular leading-7 text-[#2b363c] mb-48 max-w-[800px]">
            Esta página descreve o comportamento da API RESTful aberta e gratuita do dados.gov.pt.
          </p>
        </div>

        <div className="bg-[#F7F8FA] pt-64 pb-64">
          <div className="container mx-auto px-4">
            <div className="max-w-[800px]">
              {/* Autenticação */}
              <section className="mb-48">
                <h2 className="text-[20px] font-bold text-[#021C51] mb-16">Autenticação</h2>
                <p className="text-m-regular leading-7 text-[#2b363c] mb-16">
                  Para poder executar operações de escrita, é necessário obter uma Chave de API
                  nas definições do seu perfil.
                </p>
                <p className="text-m-regular leading-7 text-[#2b363c]">
                  Esta chave deve ser fornecida em cada chamada no cabeçalho HTTP{" "}
                  <code className="bg-[#e1e4ea] rounded px-6 py-2 text-s-regular font-mono">
                    X-API-KEY
                  </code>
                  .
                </p>
              </section>

              {/* Autorizações */}
              <section className="mb-48">
                <h2 className="text-[20px] font-bold text-[#021C51] mb-16">Autorizações</h2>
                <p className="text-m-regular leading-7 text-[#2b363c] mb-16">
                  As chamadas à API estão sujeitas às mesmas permissões que a interface web.
                </p>
                <p className="text-m-regular leading-7 text-[#2b363c]">
                  Por exemplo, é necessário fazer parte de uma organização para modificar um dos seus
                  conjuntos de dados.
                </p>
              </section>

              {/* Paginação */}
              <section className="mb-48">
                <h2 className="text-[20px] font-bold text-[#021C51] mb-16">Paginação</h2>
                <p className="text-m-regular leading-7 text-[#2b363c] mb-16">
                  Alguns métodos são paginados e seguem sempre o mesmo padrão. A lista de objetos é
                  encapsulada num objeto{" "}
                  <code className="bg-[#e1e4ea] rounded px-6 py-2 text-s-regular font-mono">
                    Page
                  </code>
                  .
                </p>
                <p className="text-m-regular leading-7 text-[#2b363c] mb-16">
                  Não é necessário calcular as páginas anterior e seguinte, pois os URLs estão
                  disponíveis na resposta nos atributos{" "}
                  <code className="bg-[#e1e4ea] rounded px-6 py-2 text-s-regular font-mono">
                    previous_page
                  </code>{" "}
                  e{" "}
                  <code className="bg-[#e1e4ea] rounded px-6 py-2 text-s-regular font-mono">
                    next_page
                  </code>
                  . Estes serão definidos como{" "}
                  <code className="bg-[#e1e4ea] rounded px-6 py-2 text-s-regular font-mono">
                    null
                  </code>{" "}
                  se não existir página anterior e/ou seguinte.
                </p>
                <p className="text-m-regular leading-7 text-[#2b363c] mb-8">
                  <u>Exemplo</u>:
                </p>
                <pre className="bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-24 overflow-x-auto text-s-regular leading-[22px] font-mono">
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
                      2,
                    )}
                  </code>
                </pre>
              </section>

              {/* Referência */}
              <section>
                <h2 className="text-[20px] font-bold text-[#021C51] mb-16">Referência</h2>
                <p className="text-m-regular leading-7 text-[#2b363c] mb-24">
                  Explore os endpoints disponíveis na documentação interativa abaixo.
                </p>
              </section>
            </div>

            {/* Swagger UI */}
            <div
              ref={swaggerRef}
              className="swagger-ui-container bg-white rounded-lg shadow-sm p-16"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
