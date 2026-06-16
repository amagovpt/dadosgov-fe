"use client";

import { Tabs, Tab, TabHeader, Icon, CardNoResults } from "@ama-pt/agora-design-system";
import { TabBodyWrapper } from "@/components/Shared/Wrappers/TabBodyWrapper";
import { DiscussionSection } from "@/components/discussions/DiscussionSection";
import TextLink from "@/components/Primitives/TextLink";
import { Dataservice } from "@/service/types/dataservice";
import type { DatasetRef } from "@/service/types/dataset";

interface DataserviceTabsProps {
  dataservice: Dataservice;
}

export const DataserviceTabs = ({ dataservice }: DataserviceTabsProps) => {
  // The detail endpoint serialises `datasets` as a reference object
  // ({ href, rel, total, type }), not an array, so read the count from `total`.
  const relatedDatasets = dataservice.datasets as unknown as
    | { total?: number; href?: string }
    | DatasetRef[]
    | null;
  const relatedTotal = Array.isArray(relatedDatasets)
    ? relatedDatasets.length
    : (relatedDatasets?.total ?? 0);

  return (
    <div className="w-full">
      <Tabs>
        <Tab>
          <TabHeader>Informações</TabHeader>
          <TabBodyWrapper>
            <div className="flex flex-col gap-16">
              <h3 className="text-base font-medium text-neutral-900">
                {relatedTotal}{" "}
                {relatedTotal === 1
                  ? "CONJUNTO DE DADOS RELACIONADO"
                  : "CONJUNTOS DE DADOS RELACIONADOS"}
              </h3>
              {relatedTotal === 0 ? (
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
              ) : Array.isArray(relatedDatasets) ? (
                <ul className="flex flex-col gap-8">
                  {relatedDatasets.map((d) => (
                    <li key={d.id}>
                      <TextLink href={d.page}>{d.title}</TextLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-neutral-900">
                  Esta API tem {relatedTotal} conjuntos de dados associados.
                </p>
              )}
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
