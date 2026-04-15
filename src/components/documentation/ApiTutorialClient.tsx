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

    function initSwagger() {
      if (cancelled || !swaggerRef.current) return;
      if ((window as any).SwaggerUIBundle) {
        (window as any).SwaggerUIBundle({
          url: SWAGGER_JSON_URL,
          domNode: swaggerRef.current,
          docExpansion: "none",
          deepLinking: false,
          layout: "BaseLayout",
        });
      }
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
          <div className="pt-[32px] mb-[64px]">
            <Breadcrumb
              items={[
                { label: "Início", url: "/" },
                { label: "Documentação da API", url: "/pages/faqs/api-documentation" },
              ]}
            />
          </div>

          <h1 className="text-2xl-medium text-[#021C51] mb-[32px] leading-tight max-w-[800px]">
            Documentação da API
          </h1>

          <p className="text-[16px] leading-[28px] text-[#2b363c] mb-[48px] max-w-[800px]">
            Esta página descreve o comportamento da API RESTful aberta e gratuita do dados.gov.pt.
          </p>
        </div>

        <div className="bg-[#F7F8FA] pt-[64px] pb-[64px]">
          <div className="container mx-auto px-4">
            <div className="max-w-[800px]">
              {/* Autenticação */}
              <section className="mb-[48px]">
                <h2 className="text-[20px] font-bold text-[#021C51] mb-[16px]">Autenticação</h2>
                <p className="text-[16px] leading-[28px] text-[#2b363c] mb-[16px]">
                  Para poder executar operações de escrita, é necessário obter uma Chave de API
                  nas definições do seu perfil.
                </p>
                <p className="text-[16px] leading-[28px] text-[#2b363c]">
                  Esta chave deve ser fornecida em cada chamada no cabeçalho HTTP{" "}
                  <code className="bg-[#e1e4ea] rounded px-[6px] py-[2px] text-[14px] font-mono">
                    X-API-KEY
                  </code>
                  .
                </p>
              </section>

              {/* Autorizações */}
              <section className="mb-[48px]">
                <h2 className="text-[20px] font-bold text-[#021C51] mb-[16px]">Autorizações</h2>
                <p className="text-[16px] leading-[28px] text-[#2b363c] mb-[16px]">
                  As chamadas à API estão sujeitas às mesmas permissões que a interface web.
                </p>
                <p className="text-[16px] leading-[28px] text-[#2b363c]">
                  Por exemplo, é necessário fazer parte de uma organização para modificar um dos seus
                  conjuntos de dados.
                </p>
              </section>

              {/* Paginação */}
              <section className="mb-[48px]">
                <h2 className="text-[20px] font-bold text-[#021C51] mb-[16px]">Paginação</h2>
                <p className="text-[16px] leading-[28px] text-[#2b363c] mb-[16px]">
                  Alguns métodos são paginados e seguem sempre o mesmo padrão. A lista de objetos é
                  encapsulada num objeto{" "}
                  <code className="bg-[#e1e4ea] rounded px-[6px] py-[2px] text-[14px] font-mono">
                    Page
                  </code>
                  .
                </p>
                <p className="text-[16px] leading-[28px] text-[#2b363c] mb-[16px]">
                  Não é necessário calcular as páginas anterior e seguinte, pois os URLs estão
                  disponíveis na resposta nos atributos{" "}
                  <code className="bg-[#e1e4ea] rounded px-[6px] py-[2px] text-[14px] font-mono">
                    previous_page
                  </code>{" "}
                  e{" "}
                  <code className="bg-[#e1e4ea] rounded px-[6px] py-[2px] text-[14px] font-mono">
                    next_page
                  </code>
                  . Estes serão definidos como{" "}
                  <code className="bg-[#e1e4ea] rounded px-[6px] py-[2px] text-[14px] font-mono">
                    null
                  </code>{" "}
                  se não existir página anterior e/ou seguinte.
                </p>
                <p className="text-[16px] leading-[28px] text-[#2b363c] mb-[8px]">
                  <u>Exemplo</u>:
                </p>
                <pre className="bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-[24px] overflow-x-auto text-[14px] leading-[22px] font-mono">
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
                <h2 className="text-[20px] font-bold text-[#021C51] mb-[16px]">Referência</h2>
                <p className="text-[16px] leading-[28px] text-[#2b363c] mb-[24px]">
                  Explore os endpoints disponíveis na documentação interativa abaixo.
                </p>
              </section>
            </div>

            {/* Swagger UI */}
            <div
              ref={swaggerRef}
              className="swagger-ui-container bg-white rounded-lg shadow-sm p-[16px]"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
