"use client";

import { useEffect, useState } from "react";
import { Tabs, Tab, TabHeader, Icon, CardNoResults } from "@ama-pt/agora-design-system";
import { TabBodyWrapper } from "@/components/Shared/Wrappers/TabBodyWrapper";
import { DiscussionSection } from "@/components/discussions/DiscussionSection";
import CardMetrics, { CardMetricsProps } from "@/components/Primitives/Cards/CardMetrics";
import { Dataservice } from "@/service/types/dataservice";
import { Dataset } from "@/service/types/dataset";
import { fetchDatasets } from "@/service/api/datasets";
import { formatDateToTimeAgo } from "@/utils/formatDate";

interface DataserviceTabsProps {
  dataservice: Dataservice;
}

const formatLongDate = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
};

export const DataserviceTabs = ({ dataservice }: DataserviceTabsProps) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetCount, setDatasetCount] = useState(0);

  const lastUpdate =
    formatLongDate(dataservice.metadata_modified_at) ||
    formatLongDate(dataservice.last_modified);
  const createdAt = formatLongDate(dataservice.created_at);

  useEffect(() => {
    async function loadDatasets() {
      try {
        const response = await fetchDatasets(1, 50, { dataservice: dataservice.id });
        setDatasets(response.data);
        setDatasetCount(response.total);
      } catch (error) {
        console.error("Error loading related datasets:", error);
      }
    }
    loadDatasets();
  }, [dataservice.id]);

  return (
    <div className="w-full">
      <Tabs>
        <Tab>
          <TabHeader>Informações</TabHeader>
          <TabBodyWrapper>
            <div className="flex flex-col gap-16">
              <h3 className="text-base font-medium text-neutral-900">
                {datasetCount}{" "}
                {datasetCount === 1
                  ? "CONJUNTO DE DADOS RELACIONADO"
                  : "CONJUNTOS DE DADOS RELACIONADOS"}
              </h3>
              {datasetCount === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon
                      name="agora-line-layers-menu"
                      className="icon-xl h-40 w-40 text-primary-500"
                    />
                  }
                  title="Sem conjuntos de dados relacionados"
                  description="Esta API ainda não tem conjuntos de dados associados."
                  hasAnchor={false}
                />
              ) : (
                <div className="grid gap-32 md:grid-cols-2 xl:grid-cols-3">
                  {datasets.map((dataset, index) => {
                    const cardProps = {
                      ...dataset,
                      last_modified: formatDateToTimeAgo(dataset.last_modified),
                      link: `/pages/datasets/${dataset.slug}`,
                    } as CardMetricsProps;
                    return <CardMetrics key={`dataset-${index}`} {...cardProps} />;
                  })}
                </div>
              )}

              {/* Technical information */}
              <div className="mt-32">
                <h3 className="mb-24 text-base font-medium uppercase text-neutral-900">
                  Informações técnicas
                </h3>
                <div className="grid gap-32 md:grid-cols-2 xl:grid-cols-3">
                  {lastUpdate && (
                    <div>
                      <h4 className="text-sm mb-8 font-bold tracking-wider text-neutral-900">
                        Última atualização
                      </h4>
                      <p className="font-medium text-neutral-900">{lastUpdate}</p>
                    </div>
                  )}
                  {createdAt && (
                    <div>
                      <h4 className="text-sm mb-8 font-bold tracking-wider text-neutral-900">
                        Data de criação
                      </h4>
                      <p className="font-medium text-neutral-900">{createdAt}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm mb-8 font-bold tracking-wider text-neutral-900">
                      Identificador
                    </h4>
                    <p className="break-all font-medium text-neutral-900">{dataservice.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabBodyWrapper>
        </Tab>
        <Tab>
          <TabHeader>Discussões ({dataservice.metrics?.discussions || 0})</TabHeader>
          <TabBodyWrapper>
            <DiscussionSection entityId={dataservice.id} entityClass="Dataservice" />
          </TabBodyWrapper>
        </Tab>
      </Tabs>
    </div>
  );
};
