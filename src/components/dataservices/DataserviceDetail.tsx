import "server-only";

import { Suspense } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import initTranslations from "@/app/i18n";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import TextLink from "@/components/Primitives/TextLink";
import type { Dataservice } from "@/service/types/dataservice";
import type { RelatedDatasetsResult, DataserviceDiscussionsResult, DataserviceActionsState } from "@/service/types/dataservice/detail";
import type { ParsedSwagger } from "@/utils/parseOpenApi";
import { formatMetricValue } from "@/utils/formatNumber";
import { formatDateLong } from "@/utils/formatDate";
import { ACCESS_TYPE_PILL_VARIANTS } from "@/utils/dataserviceLabels";
import { DataserviceColumns, SwaggerProvider, SwaggerShortcut, SwaggerPanel, ExternalDocumentationButton, Icon, Pill } from "./DataserviceDetailClient";
import { DataserviceActions } from "./DataserviceActions";
import { DataserviceTabs } from "./DataserviceTabs";
import { DataserviceRelatedDatasets, RelatedDatasetsLoading } from "./DataserviceRelatedDatasets";

export default async function DataserviceDetail({ dataservice, datasets, swagger, discussions, actions, locale }: {
  dataservice: Dataservice;
  datasets: Promise<RelatedDatasetsResult>;
  swagger: Promise<ParsedSwagger | null>;
  discussions: Promise<DataserviceDiscussionsResult>;
  actions: Promise<DataserviceActionsState>;
  locale: string;
}) {
  // The action row belongs to the main page: do not show a temporary favourite
  // state or insert Edit after the details are already visible. Optional
  // datasets, discussions and Swagger keep their independent boundaries below.
  const [{ i18n }, actionState] = await Promise.all([
    initTranslations({ locale, namespaces: ["common", "dataservices"] }),
    actions,
  ]);
  const t = i18n.getFixedT(locale, "common");
  const tDs = i18n.getFixedT(locale, "dataservices");
  const language = locale as "pt" | "en";
  const documentationUrl = dataservice.machine_documentation_url;
  const ownerFullName = dataservice.owner
    ? `${dataservice.owner.first_name} ${dataservice.owner.last_name}`.trim()
    : null;

  const accessType = dataservice.access_type;
  const accessPillLabel = accessType
    ? tDs(`access.pill.${accessType}`, { defaultValue: accessType.toUpperCase() })
    : null;
  const accessPillVariant = accessType
    ? ACCESS_TYPE_PILL_VARIANTS[accessType] ?? "neutral"
    : "neutral";
  // Audience conditions only carry meaning for restricted access.
  const audiences =
    accessType === "restricted" ? dataservice.access_audiences ?? [] : [];
  const restrictionReason =
    accessType === "restricted"
      ? dataservice.access_type_reason_category
        ? tDs(`access.restrictionReason.${dataservice.access_type_reason_category}`, {
            defaultValue: dataservice.access_type_reason_category,
          })
        : dataservice.access_type_reason ?? null
      : null;

  // Authentication method derived from the access type, so users immediately
  // know whether a key/account is needed before reading the technical details.
  const authLabel = accessType
    ? tDs(`access.auth.${accessType}`, { defaultValue: "" }) || null
    : null;

  // Only render the technical box when at least one technical field exists.
  const hasTechnical = Boolean(
    dataservice.base_api_url ||
      dataservice.rate_limiting ||
      dataservice.availability != null ||
      dataservice.technical_documentation_url ||
      dataservice.business_documentation_url ||
      documentationUrl
  );

  const NOT_PROVIDED = tDs("detail.notProvided");

  // The list endpoint exposes the modification timestamp as metadata_modified_at;
  // last_modified can be absent (which rendered "Invalid Date").
  const formatLongDate = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : formatDateLong(value, language);
  };
  const lastUpdate =
    formatLongDate(dataservice.metadata_modified_at) ||
    formatLongDate(dataservice.last_modified);

  const createdAt = formatLongDate(dataservice.created_at);
  return (
    <SwaggerProvider>
      <main className="flex w-full flex-col items-center justify-center gap-64">
        <div className="container flex items-center justify-between py-64">
          <BreadcrumbDynamic darkMode={false} currentLabel={dataservice.title} />
        </div>
        <div className="container flex items-center justify-end gap-16" data-testid="dataservice-actions">
          {dataservice.private && <Pill variant="warning">{tDs("detail.draft")}</Pill>}
          {dataservice.archived_at && <Pill variant="neutral">{tDs("detail.archived")}</Pill>}
          <DataserviceActions id={dataservice.id} slug={dataservice.slug} locale={locale} state={actionState}
            labels={{ add: tDs("detail.addFavorite"), remove: tDs("detail.removeFavorite"), error: tDs("detail.favoriteError"), edit: tDs("detail.edit") }} />
        </div>
        <DataserviceColumns
          title={<h1 className="mb-24 text-xl-bold leading-tight text-primary-900">{dataservice.title}</h1>}
          description={
            <div className="content-wrapper markdown-container rich-text-content text-m-light text-neutral-900">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                {dataservice.description}
              </ReactMarkdown>
            </div>
          }
          sidebar={
            <>
              {/* Identity box */}
              <div className="mb-16 flex flex-col gap-16 rounded-4 bg-[#F2F6FF] p-32">
                {dataservice.organization?.logo ? (
                  <div className="flex h-48 w-fit items-center justify-center rounded-8 border-2 border-primary-300 py-8">
                    <img
                      src={dataservice.organization.logo}
                      alt={dataservice.organization.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex w-fit items-center justify-center rounded-8 border border-neutral-200 bg-neutral-100 px-12 py-12 text-neutral-400">
                    <Icon
                      name={dataservice.owner ? "agora-line-user" : "agora-line-buildings"}
                      className="h-6 w-6"
                    />
                  </div>
                )}

                <div className="space-y-16">
                  <div className="text-m-light text-neutral-900">
                    {dataservice.organization ? (
                      <Link
                        href={`/organizations/${dataservice.organization.slug}`}
                        className="hover:underline"
                      >
                        {dataservice.organization.name}
                      </Link>
                    ) : dataservice.owner ? (
                      <Link href={`/users/${dataservice.owner.slug}`} className="hover:underline">
                        {ownerFullName}
                      </Link>
                    ) : (
                      tDs("detail.noAuthor")
                    )}
                  </div>
                  {lastUpdate && (
                    <div className="text-sm text-neutral-900">
                      <span className="text-m-semibold">{tDs("detail.lastUpdate")}</span> {lastUpdate}
                    </div>
                  )}
                </div>
              </div>

              {/* Access conditions box */}
              <div className="mb-16 flex flex-col gap-16 rounded-4 bg-[#F2F6FF] p-32">
                <div className="text-m-semibold text-neutral-500">{tDs("detail.accessConditions")}</div>

                <div className="text-sm text-neutral-900">
                  <div className="mb-4">{tDs("detail.access")}</div>
                  {accessPillLabel ? (
                    <Pill variant={accessPillVariant}>{accessPillLabel}</Pill>
                  ) : (
                    NOT_PROVIDED
                  )}
                </div>

                <div className="text-sm text-neutral-900">
                  <div className="mb-4">{tDs("detail.authentication")}</div>
                  <div className="text-m-semibold">{authLabel ?? NOT_PROVIDED}</div>
                </div>

                {accessType === "restricted" && (
                  <div className="text-sm text-neutral-900">
                    <div className="mb-4">{tDs("detail.eligibleAudiences")}</div>
                    {audiences.length > 0 ? (
                      <ul className="list-disc pl-20">
                        {audiences.map((a) => (
                          <li key={a.role}>
                            {tDs(`access.audienceRole.${a.role}`, {
                              defaultValue: a.role,
                            })}
                            :{" "}
                            {tDs(`access.audienceCondition.${a.condition}`, {
                              defaultValue: a.condition,
                            })}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      tDs("detail.notSpecified")
                    )}
                  </div>
                )}
                {restrictionReason && (
                  <div className="text-sm text-neutral-900">
                    <span className="text-m-semibold">{tDs("detail.restrictionReason")}</span>{" "}
                    {restrictionReason}
                  </div>
                )}
                {dataservice.authorization_request_url && (
                  <div>
                    <ExternalDocumentationButton
                      variant="primary"
                      hasIcon={true}
                      trailingIcon="agora-line-external-link"
                      trailingIconHover="agora-solid-external-link"
                      href={dataservice.authorization_request_url}
                    >
                      {tDs("detail.requestAccess")}
                    </ExternalDocumentationButton>
                  </div>
                )}
              </div>

              {/* Technical characteristics box */}
              {hasTechnical && (
              <div className="mb-16 flex flex-col gap-16 rounded-4 bg-[#F2F6FF] p-32">
                <div className="text-m-semibold text-neutral-500">{tDs("detail.technicalCharacteristics")}</div>

                {dataservice.base_api_url && (
                  <div className="text-sm text-neutral-900">
                    <div className="mb-4">{tDs("detail.baseApiUrl")}</div>
                    <div className="rounded-4 bg-neutral-200 px-12 py-8 font-mono text-sm break-all text-neutral-900">
                      {dataservice.base_api_url}
                    </div>
                  </div>
                )}
                {dataservice.rate_limiting && (
                  <div className="text-sm text-neutral-900">
                    <div className="mb-4">{tDs("detail.rateLimit")}</div>
                    {dataservice.rate_limiting_url ? (
                      <TextLink href={dataservice.rate_limiting_url}>
                        {dataservice.rate_limiting}
                      </TextLink>
                    ) : (
                      <span className="text-m-semibold">{dataservice.rate_limiting}</span>
                    )}
                  </div>
                )}
                {dataservice.availability != null && (
                  <div className="text-sm text-neutral-900">
                    <div className="mb-4">{tDs("detail.availability")}</div>
                    <span className="text-m-semibold">{`${dataservice.availability}%`}</span>
                  </div>
                )}

                {(dataservice.technical_documentation_url ||
                  dataservice.business_documentation_url ||
                  documentationUrl) && (
                  <div className="text-sm text-neutral-900">
                    <div className="mb-8">{tDs("detail.documentation")}</div>
                    <div className="flex flex-col items-start gap-8">
                      {dataservice.technical_documentation_url && (
                        <ExternalDocumentationButton
                          appearance="outline"
                          variant="neutral"
                          hasIcon={true}
                          trailingIcon="agora-line-external-link"
                          trailingIconHover="agora-solid-external-link"
                          href={dataservice.technical_documentation_url}
                        >
                          {tDs("detail.technicalDocumentation")}
                        </ExternalDocumentationButton>
                      )}
                      {dataservice.business_documentation_url && (
                        <ExternalDocumentationButton
                          appearance="outline"
                          variant="neutral"
                          hasIcon={true}
                          trailingIcon="agora-line-external-link"
                          trailingIconHover="agora-solid-external-link"
                          href={dataservice.business_documentation_url}
                        >
                          {tDs("detail.functionalDocumentation")}
                        </ExternalDocumentationButton>
                      )}
                      {documentationUrl && (
                        <SwaggerShortcut>{tDs("detail.swagger")}</SwaggerShortcut>
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Metrics */}
              <div className="mb-16 grid grid-cols-2 gap-16">
                <div className="rounded-4 bg-[#F2F6FF] p-32">
                  <div className="text-sm mb-8">{t("card.views")}</div>
                  <div className="mb-8 text-l-semibold font-bold text-neutral-900">
                    {formatMetricValue(dataservice.metrics?.views)}
                  </div>
                </div>
                <div className="rounded-4 bg-[#F2F6FF] p-32">
                  <div className="text-sm mb-8">{t("card.favorites")}</div>
                  <div className="mb-8 text-l-semibold font-bold text-neutral-900">
                    {formatMetricValue(dataservice.metrics?.followers)}
                  </div>
                </div>
              </div>
            </>
          }
        />
        {documentationUrl && (
          <div className="container my-32">
            <SwaggerPanel promise={swagger} machineDocumentationUrl={documentationUrl} />
          </div>
        )}
        <section className="w-full">
          <DataserviceTabs
            id={dataservice.id}
            discussionCount={dataservice.metrics?.discussions ?? 0}
            discussions={discussions}
            information={
              <div className="flex flex-col gap-16">
                <div data-testid="dataservice-datasets">
                  <Suspense fallback={<RelatedDatasetsLoading />}>
                    <DataserviceRelatedDatasets datasets={datasets} />
                  </Suspense>
                </div>
                {/* Technical information */}
                <div className="mt-32 rounded-4 bg-white p-32">
                  <h3 className="mb-24 text-base font-medium uppercase text-neutral-900">
                    {tDs("tabs.technicalInfo")}
                  </h3>
                  <div className="grid gap-32 md:grid-cols-2 xl:grid-cols-3">
                    {lastUpdate && (
                      <div>
                        <h4 className="text-sm mb-8 font-bold tracking-wider text-neutral-900">
                          {tDs("tabs.lastUpdate")}
                        </h4>
                        <p className="font-medium text-neutral-900">{lastUpdate}</p>
                      </div>
                    )}
                    {createdAt && (
                      <div>
                        <h4 className="text-sm mb-8 font-bold tracking-wider text-neutral-900">
                          {tDs("tabs.createdAt")}
                        </h4>
                        <p className="font-medium text-neutral-900">{createdAt}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm mb-8 font-bold tracking-wider text-neutral-900">
                        {tDs("tabs.identifier")}
                      </h4>
                      <p className="break-all font-medium text-neutral-900">{dataservice.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </section>
      </main>
    </SwaggerProvider>
  );
}
