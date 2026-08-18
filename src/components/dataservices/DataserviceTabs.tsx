"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, Tab, TabHeader, Icon, CardNoResults } from "@ama-pt/agora-design-system";
import { TabBodyWrapper } from "@/components/Shared/Wrappers/TabBodyWrapper";
import { DiscussionSection } from "@/components/discussions/DiscussionSection";
import CardMetrics, { CardMetricsProps } from "@/components/Primitives/Cards/CardMetrics";
import { Dataservice } from "@/service/types/dataservice";
import { Dataset } from "@/service/types/dataset";
import { fetchDatasets } from "@/service/api/datasets";
import { formatDateToTimeAgo, formatDateLong } from "@/utils/formatDate";

interface DataserviceTabsProps {
  dataservice: Dataservice;
}

export const DataserviceTabs = ({ dataservice }: DataserviceTabsProps) => {
  const { i18n } = useTranslation("common");
  const { t: tDs } = useTranslation("dataservices");
  const language = i18n.language as "pt" | "en";
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetCount, setDatasetCount] = useState(0);
  const [discussionCount, setDiscussionCount] = useState(
    dataservice.metrics?.discussions || 0,
  );

  const formatLongDate = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : formatDateLong(value, language);
  };

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
          <TabHeader>{tDs("tabs.info")}</TabHeader>
          <TabBodyWrapper>
            <div className="flex flex-col gap-16">
              <h3 className="text-base font-medium text-neutral-900">
                {tDs("tabs.relatedDatasetsCount", { count: datasetCount })}
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
                  title={tDs("tabs.noRelatedTitle")}
                  description={tDs("tabs.noRelatedDesc")}
                  hasAnchor={false}
                />
              ) : (
                <div className="tab-body-bleed grid gap-32 md:grid-cols-2 xl:grid-cols-3">
                  {/* `tab-body-bleed` activates the existing white-card + 2px
                      neutral-700 outline rule (globals.css). It lives on the grid
                      rather than TabBodyWrapper because agora's Tabs renders only
                      the tab body's children, discarding the wrapper element. */}
                  {datasets.map((dataset, index) => {
                    const cardProps = {
                      ...dataset,
                      last_modified: formatDateToTimeAgo(dataset.last_modified, language),
                      link: `/datasets/${dataset.slug}`,
                    } as CardMetricsProps;
                    return <CardMetrics key={`dataset-${index}`} {...cardProps} />;
                  })}
                </div>
              )}

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
          </TabBodyWrapper>
        </Tab>
        <Tab>
          <TabHeader>
            {tDs("tabs.discussions", { count: discussionCount })}
          </TabHeader>
          <TabBodyWrapper>
            <DiscussionSection
              entityId={dataservice.id}
              entityClass="Dataservice"
              onCountChange={setDiscussionCount}
            />
          </TabBodyWrapper>
        </Tab>
      </Tabs>
    </div>
  );
};
