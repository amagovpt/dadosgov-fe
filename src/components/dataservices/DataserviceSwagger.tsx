"use client";

import { useTranslation } from "react-i18next";
import { CopyField } from "@/components/datasets/DatasetResourcesTable/CopyField";
import { Accordion } from "@/components/Shared/Accordion";
import type { ParsedSwagger } from "@/utils/parseOpenApi";

interface DataserviceSwaggerProps {
  swagger: ParsedSwagger;
  machineDocumentationUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Public Swagger UI viewer that renders any spec by URL. Swap for a
// self-hosted instance if desired.
const SWAGGER_UI_VIEWER = "https://petstore.swagger.io/";

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-informative-100 text-informative-700",
  POST: "bg-success-100 text-success-700",
  PUT: "bg-warning-100 text-warning-700",
  PATCH: "bg-warning-100 text-warning-700",
  DELETE: "bg-danger-100 text-danger-700",
};

export const DataserviceSwagger = ({
  swagger,
  machineDocumentationUrl,
  open,
  onOpenChange,
}: DataserviceSwaggerProps) => {
  const { t: tDs } = useTranslation("dataservices");
  const swaggerUiUrl = `${SWAGGER_UI_VIEWER}?url=${encodeURIComponent(machineDocumentationUrl)}`;

  return (
    <section id="swagger" className="scroll-mt-24">
      <Accordion.Root>
        <Accordion.Item
          headingTitle="Swagger"
          headingLevel="h2"
          expanded={open}
          onChange={(e) =>
            onOpenChange(Boolean((e.currentTarget as { isExpanded?: boolean } | null)?.isExpanded))
          }
        >
          <div className="flex flex-col gap-24">
            <div className="flex flex-wrap items-center justify-between gap-16">
              {swagger.version && (
                <span className="text-sm text-neutral-700">
                  {tDs("swagger.versionLabel")}{" "}
                  <strong className="text-neutral-900">{swagger.version}</strong>
                </span>
              )}
              <a
                href={swaggerUiUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary-600 underline hover:text-primary-800"
              >
                {tDs("swagger.openInSwaggerUi")}
              </a>
            </div>

            {swagger.baseUrl && <CopyField label={tDs("swagger.baseUrl")} value={swagger.baseUrl} />}

            {swagger.groups.map((group) => (
              <div key={group.tag} className="flex flex-col gap-8">
                <h3 className="text-base font-medium text-neutral-900">
                  {group.tag}{" "}
                  <span className="text-sm font-normal text-neutral-500">
                    {group.endpoints.length}
                  </span>
                </h3>
                <ul className="flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
                  {group.endpoints.map((endpoint, index) => (
                    <li
                      key={`${endpoint.method}-${endpoint.path}-${index}`}
                      className="flex flex-wrap items-center gap-12 py-8"
                    >
                      <span
                        className={`rounded-4 px-8 py-2 text-xs font-bold ${
                          METHOD_STYLES[endpoint.method] ?? "bg-neutral-200 text-neutral-700"
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="font-mono text-sm text-neutral-900">{endpoint.path}</code>
                      {endpoint.summary && (
                        <span className="text-sm text-neutral-600">{endpoint.summary}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {swagger.models.length > 0 && (
              <div className="flex flex-col gap-8">
                <h3 className="text-base font-medium text-neutral-900">
                  {tDs("swagger.models")}{" "}
                  <span className="text-sm font-normal text-neutral-500">
                    {swagger.models.length}
                  </span>
                </h3>
                <ul className="flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
                  {swagger.models.map((model) => (
                    <li key={model.name} className="flex flex-wrap items-baseline gap-8 py-8">
                      <code className="font-mono text-sm text-neutral-900">{model.name}</code>
                      {model.description && (
                        <span className="text-sm text-neutral-600">{model.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Accordion.Item>
      </Accordion.Root>
    </section>
  );
};
