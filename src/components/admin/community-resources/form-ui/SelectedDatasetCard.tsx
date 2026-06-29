"use client";

import Link from "next/link";
import { Button, CardLinks, Icon } from "@ama-pt/agora-design-system";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import type { Dataset } from "@/service/types/dataset";
import { formatMetricValue } from "@/utils/formatNumber";

interface SelectedDatasetCardProps {
  dataset: Dataset;
  canRemove: boolean;
  onRemove: () => void;
}

export default function SelectedDatasetCard({
  dataset,
  canRemove,
  onRemove,
}: SelectedDatasetCardProps) {
  return (
    <div className="agora-card-links-datasets-px0 mt-16">
      <CardLinks
        onClick={() => {}}
        className="cursor-pointer text-neutral-900"
        variant="transparent"
        image={{
          src: dataset.organization?.logo || "/images/placeholders/organization.png",
          alt: dataset.organization?.name || "Organização sem logo",
        }}
        category={dataset.organization?.name}
        title={dataset.title}
        description={
          <div className="flex flex-col gap-12">
            <p className="text-sm mt-8 line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
              {dataset.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-8">
              <span className="text-sm font-medium text-neutral-900">
                Metadados: {dataset.quality?.score != null ? Math.round(dataset.quality.score * 100) : 0}%
              </span>
            </div>
            <div className="text-xs mb-32 mt-32 flex flex-wrap items-center gap-32 text-[#034AD8]">
              <div className="flex items-center gap-8" title="Visualizações">
                <Icon name="agora-line-eye" className="" aria-hidden="true" />
                <span>{formatMetricValue(dataset.metrics?.views)}</span>
              </div>
              <div className="flex items-center gap-8" title="Downloads">
                <Icon name="agora-line-download" className="" aria-hidden="true" />
                <span>{formatMetricValue(dataset.metrics?.resources_downloads, 0)}</span>
              </div>
              <div className="flex items-center gap-8" title="Reutilizações">
                <img src="/Icons/bar_chart.svg" className="" alt="" aria-hidden="true" />
                <span>{dataset.metrics?.reuses || 0}</span>
              </div>
              <div className="flex items-center gap-8" title="Favoritos">
                <img src="/Icons/favorite.svg" className="" alt="" aria-hidden="true" />
                <span>{formatMetricValue(dataset.metrics?.followers, 0)}</span>
              </div>
            </div>
          </div>
        }
        date={
          <span className="font-[300]">
            {`Atualizado há ${formatDistanceToNow(new Date(dataset.last_modified), { locale: pt })
              .replace("aproximadamente ", "")
              .replace("quase ", "")
              .replace("menos de ", "")
              .replace("cerca de ", "")}`}
          </span>
        }
        mainLink={
          <Link href={`/datasets/${dataset.slug}`}>
            <span className="underline">{dataset.title}</span>
          </Link>
        }
        blockedLink={true}
      />
      {canRemove && (
        <div className="mt-8 flex justify-end">
          <Button
            appearance="solid"
            variant="danger"
            hasIcon
            leadingIcon="agora-line-trash"
            leadingIconHover="agora-solid-trash"
            onClick={onRemove}
          >
            Remover
          </Button>
        </div>
      )}
    </div>
  );
}
