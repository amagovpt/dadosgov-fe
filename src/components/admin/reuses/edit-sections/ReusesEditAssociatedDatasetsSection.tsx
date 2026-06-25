import React from "react";
import { Button, Icon } from "@ama-pt/agora-design-system";
import CardMetrics from "@/components/Primitives/Cards/CardMetrics";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import type { Dataset } from "@/service/types/dataset";

interface ReusesEditAssociatedDatasetsSectionProps {
  associatedDatasets: Dataset[];
  isSubmitting: boolean;
  onRemoveAssociatedDataset: (datasetId: string) => void;
  onRemoveAllAssociatedDatasets: () => void;
}

export default function ReusesEditAssociatedDatasetsSection({
  associatedDatasets,
  isSubmitting,
  onRemoveAssociatedDataset,
  onRemoveAllAssociatedDatasets,
}: ReusesEditAssociatedDatasetsSectionProps) {
  if (associatedDatasets.length === 0) {
    return null;
  }

  return (
    <div className="mb-24">
      <div className="mb-16 flex justify-end">
        <Button
          appearance="outline"
          variant="danger"
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
          disabled={isSubmitting}
          onClick={onRemoveAllAssociatedDatasets}
        >
          Eliminar todos
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-16">
        {associatedDatasets.map((dataset) => (
          <div key={dataset.id} className="relative group/card">
            <CardMetrics
              link={`/pages/datasets/${dataset.slug}`}
              title={dataset.title}
              description={dataset.description || ""}
              last_modified={formatDateToTimeAgo(dataset.last_modified)}
              organization={
                dataset.organization
                  ? {
                      name: dataset.organization.name,
                      logo: dataset.organization.logo ?? undefined,
                    }
                  : undefined
              }
              quality={dataset.quality}
              metrics={dataset.metrics}
            />
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onRemoveAssociatedDataset(dataset.id)}
              className="rounded group absolute right-8 top-8 z-10 p-4"
              title="Eliminar"
            >
              <Icon
                name="agora-line-trash"
                className="block h-[18px] w-[18px] !fill-[var(--color-danger-600)] group-hover:hidden"
              />
              <Icon
                name="agora-solid-trash"
                className="hidden h-[18px] w-[18px] !fill-[var(--color-danger-600)] group-hover:block"
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
