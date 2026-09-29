"use client";

import { use } from "react";
import { useTranslation } from "react-i18next";
import { CardNoResults, Icon } from "@ama-pt/agora-design-system";
import CardMetrics from "@/components/Primitives/Cards/CardMetrics";
import type { RelatedDatasetsResult } from "@/service/types/dataservice/detail";
import { formatDateToTimeAgo } from "@/utils/formatDate";

export function RelatedDatasetsLoading() {
  const { t } = useTranslation("dataservices");
  return <p role="status">{t("tabs.loadingDatasets")}</p>;
}

export function DataserviceRelatedDatasets({ datasets }: { datasets: Promise<RelatedDatasetsResult> }) {
  const result = use(datasets);
  const { t, i18n } = useTranslation("dataservices");
  if (!result) return <p role="alert">{t("tabs.datasetsError")}</p>;

  return (
    <div className="flex flex-col gap-16">
      <h3 className="text-base font-medium text-neutral-900">
        {t("tabs.relatedDatasetsCount", { count: result.total })}
      </h3>
      {result.total === 0 ? (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-layers-menu" className="icon-xl h-40 w-40 text-primary-500" />}
          title={t("tabs.noRelatedTitle")}
          description={t("tabs.noRelatedDesc")}
          hasAnchor={false}
        />
      ) : (
        <div className="tab-body-bleed grid gap-32 md:grid-cols-2 xl:grid-cols-3">
          {result.data.map((dataset) => (
            <CardMetrics
              key={dataset.id}
              {...dataset}
              last_modified={formatDateToTimeAgo(dataset.last_modified, i18n.language as "pt" | "en")}
              link={`/datasets/${dataset.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
