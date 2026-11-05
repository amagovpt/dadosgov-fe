"use client";

import { useCallback, useRef, useState, type ComponentProps, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Anchor, CardExpandable, Icon, Pill, ProgressBar } from "@ama-pt/agora-design-system";
import type { Dataset } from "@/service/types/dataset";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import { QUALITY_CRITERIA, getQualityMissing } from "@/utils/datasetQuality";
import { getDatasetLastUpdate } from "@/utils/datasetDates";
import { formatPortalDate } from "@/utils/formatDate";
import { formatMetricValue } from "@/utils/formatNumber";

function SidebarLink(props: ComponentProps<typeof Anchor>) {
  return <Anchor appearance="link" className="max-w-full self-start text-left" {...props} />;
}

function IconFrame({ name }: { name: string }) {
  return (
    <span className="flex size-56 shrink-0 items-center justify-center rounded-8 border-2 border-primary-300">
      <Icon name={name} className="fill-primary-600" aria-hidden="true" />
    </span>
  );
}

function PublisherImage({ src, name, isOwner }: { src?: string; name: string; isOwner: boolean }) {
  const [failed, setFailed] = useState(false);

  return src && !failed ? (
    <img
      ref={(element) => {
        if (element?.complete && !element.naturalWidth) setFailed(true);
      }}
      src={src}
      alt={name}
      className={`h-48 max-w-full object-contain ${isOwner ? "rounded-full" : ""}`}
      onError={() => setFailed(true)}
    />
  ) : (
    <IconFrame name={isOwner ? "agora-line-user" : "agora-line-buildings"} />
  );
}

interface DatasetDetailSidebarProps {
  dataset: Dataset;
  sidebarRef: RefObject<HTMLDivElement | null>;
}

export function DatasetDetailSidebar({ dataset, sidebarRef }: DatasetDetailSidebarProps) {
  const { t } = useTranslation("datasets");
  const [qualityExpanded, setQualityExpanded] = useState(false);
  const qualityExpandedRef = useRef(false);

  // Agora's accordion callbacks can fire while rendering. Defer and deduplicate updates.
  const syncQualityExpanded = useCallback((next: boolean) => {
    if (qualityExpandedRef.current === next) return;
    qualityExpandedRef.current = next;
    queueMicrotask(() => setQualityExpanded(next));
  }, []);

  const ownerName = dataset.owner
    ? `${dataset.owner.first_name} ${dataset.owner.last_name}`.trim()
    : null;
  const publisherName = dataset.organization?.name || ownerName || t("detail.noAuthor");
  const publisherHref = dataset.organization
    ? `/organizations/${dataset.organization.slug}`
    : dataset.owner
      ? `/users/${dataset.owner.slug}`
      : null;
  const image = dataset.organization?.logo || dataset.owner?.avatar_thumbnail || undefined;
  const lastUpdate = getDatasetLastUpdate(dataset);
  const qualityScore = calculateQualityScore(QUALITY_CRITERIA, dataset.quality);
  const qualityMissing = getQualityMissing(dataset.quality);
  const metrics = [
    { label: t("detail.views"), value: dataset.metrics?.views, icon: "agora-solid-eye" },
    {
      label: t("detail.transfers"),
      value: dataset.metrics?.resources_downloads,
      icon: "agora-line-download",
    },
  ];

  return (
    <div ref={sidebarRef} className="flex h-fit min-w-0 flex-col gap-32">
      <div className="flex flex-col gap-16 rounded-4 bg-primary-100 p-32">
        <div className="border-b border-neutral-700 pb-16">
          <PublisherImage
            key={image}
            src={image}
            name={publisherName}
            isOwner={!dataset.organization && !!dataset.owner}
          />
        </div>
        {publisherHref ? (
          <SidebarLink href={publisherHref} target="_blank" rel="noopener noreferrer">
            {publisherName}
          </SidebarLink>
        ) : (
          publisherName
        )}
        {dataset.license && (
          <SidebarLink
            href={dataset.license_url || `/recursos/como-usar-o-portal/licencas#${dataset.license}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {dataset.license_title || dataset.license}
          </SidebarLink>
        )}
        {lastUpdate && (
          <Pill variant="primary" size="large" className="w-fit px-16">
            <time dateTime={lastUpdate} className="text-s-regular">
              {t("detail.updatedOn", { date: formatPortalDate(lastUpdate, "dd.MM.yyyy") })}
            </time>
          </Pill>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-16 text-primary-600 sm:gap-32">
        {metrics.map(({ label, value, icon }) => (
          <div key={icon} className="flex flex-col-reverse justify-end">
            <dt className="sm:pl-72">{label}</dt>
            <dd className="flex flex-wrap items-center gap-8 sm:gap-16">
              <IconFrame name={icon} />
              <span className="text-3xl-bold">{formatMetricValue(value)}</span>
            </dd>
          </div>
        ))}
      </dl>

      {!!dataset.contact_points?.length && (
        <section
          aria-labelledby="dataset-contacts-title"
          className="flex flex-col gap-32 bg-primary-100 p-32 text-neutral-900"
        >
          <h2 id="dataset-contacts-title" className="text-l-bold">
            {t("detail.contacts")}
          </h2>
          <div className="flex flex-col gap-16">
            {dataset.contact_points.map((contact) => (
              <div
                key={contact.id}
                className="flex flex-col gap-16 border-neutral-700 not-last:border-b not-last:pb-16 not-last:mb-16"
              >
                <div className="flex flex-col gap-8">
                  <h3 className="text-m-bold">
                    {t(`contactRoles.${contact.role}`, { defaultValue: contact.role })}
                  </h3>
                  <p>{contact.name}</p>
                </div>
                {contact.email && (
                  <SidebarLink href={`mailto:${contact.email}`}>{contact.email}</SidebarLink>
                )}
                {contact.contact_form && (
                  <SidebarLink
                    href={contact.contact_form}
                    target="_blank"
                    rel="noopener noreferrer"
                    hasIcon
                    trailingIcon="agora-line-external-link"
                    trailingIconHover="agora-solid-external-link"
                  >
                    {t("detail.contactForm")}
                  </SidebarLink>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <CardExpandable
        variant="primary-100"
        cardTitle={t("detail.quality.title")}
        cardHeadingLevel="h2"
        cardSubtitle={
          <ProgressBar
            className="mt-16"
            value={qualityScore}
            max={100}
            appearance="regular"
            current
            label={t("detail.quality.title")}
            hideLabel
          />
        }
        accordionHeadingTitle={
          qualityExpanded ? t("detail.quality.collapse") : t("detail.quality.improvements")
        }
        expanded={qualityExpanded}
        onExpanded={() => syncQualityExpanded(true)}
        onCollapsed={() => syncQualityExpanded(false)}
      >
        <ul className="flex flex-col gap-8">
          {qualityMissing.map((key) => (
            <li key={key} className="flex items-start gap-8">
              <Icon
                name="agora-line-alert-triangle"
                className="shrink-0 fill-warning-800"
                aria-hidden="true"
              />
              <span>{t("detail.quality.missing", { label: t(`quality.${key}`) })}</span>
            </li>
          ))}
          {!qualityMissing.length && <li>{t("detail.quality.complete")}</li>}
        </ul>
      </CardExpandable>
    </div>
  );
}
