"use client";

import React from "react";
import { Icon, Pill } from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { Activity } from "@/service/types/catalog";
import type { Dataset } from "@/service/types/dataset";
import TextLink from "@/components/Primitives/TextLink";

type DatasetsEditInfoPanelProps = {
  dataset: Dataset;
  latestActivity: Activity | null;
  metadataCount: number;
  qualityScore: number;
  translateActivityLabel: (label: string) => string;
};

export default function DatasetsEditInfoPanel({
  dataset,
  latestActivity,
  metadataCount,
  qualityScore,
  translateActivityLabel,
}: DatasetsEditInfoPanelProps) {
  return (
    <div className="admin-edit-info">
      <div className="admin-edit-info__badges">
        <Pill variant={dataset.private ? "warning" : "success"}>
          {dataset.private ? "RASCUNHO" : "PÚBLICO"}
        </Pill>
        {dataset.featured && <Pill variant="informative">DESTAQUE</Pill>}
        <span className="admin-edit-info__stat">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="admin-edit-info__stat-icon"
          >
            <path
              d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z"
              fill="#64718B"
            />
          </svg>
          {`${(dataset.metrics?.views ?? 0) + (dataset.metrics?.resources_downloads ?? 0) + (dataset.metrics?.reuses ?? 0) + (dataset.metrics?.followers ?? 0)} estatísticas`}
        </span>
        <span className="admin-edit-info__stat">
          <Icon name="agora-line-document" className="admin-edit-info__stat-icon" />
          {`${metadataCount} metadados`}
        </span>
        <span className="admin-edit-info__stat">
          <Icon name="agora-line-star" className="admin-edit-info__stat-icon" />
          {qualityScore > 0 ? (qualityScore / 10).toFixed(1).replace(".", ",") : "0"}
        </span>
      </div>

      <p className="admin-edit-info__activity">
        <Icon name="agora-line-clock" className="admin-edit-info__clock-icon" />
        {latestActivity ? (
          <>
            {" Atividade mais recente: "}
            <TextLink href={`/pages/users/${latestActivity.actor.slug}`}>
              {latestActivity.actor.first_name} {latestActivity.actor.last_name}
            </TextLink>
            {" — "}
            {translateActivityLabel(latestActivity.label)}
            {" — "}
            <span>
              {format(new Date(latestActivity.created_at), "d 'de' MMMM 'de' yyyy", {
                locale: pt,
              })}
            </span>
          </>
        ) : (
          <>
            {" Atividade mais recente: "}
            {dataset.owner && (
              <TextLink href={`/pages/users/${dataset.owner.slug}`}>
                {dataset.owner.first_name} {dataset.owner.last_name}
              </TextLink>
            )}
            {" — editou o conjunto de dados — "}
            <span>
              {format(new Date(dataset.last_modified), "d 'de' MMMM 'de' yyyy", {
                locale: pt,
              })}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
