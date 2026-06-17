'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, Tab, TabHeader, CardNoResults, Icon, StatusCard, Button } from '@ama-pt/agora-design-system';
import { TabBodyWrapper } from '@/components/Shared/Wrappers/TabBodyWrapper';
import { ReuseCardLinks } from '@/components/Shared/ReuseCardLinks';
import { DataserviceCardLinks } from '@/components/Shared/DataserviceCardLinks';
import { CommunityResource } from "@/service/types/community-resource";
import { Dataset } from "@/service/types/dataset";
import { Reuse } from "@/service/types/reuse";
import { Dataservice } from "@/service/types/dataservice";
import { fetchCommunityResourcesByDataset } from "@/service/api/community-resources";
import { fetchReuses } from "@/service/api/reuses";
import { fetchDataservices } from "@/service/api/dataservices";
import { DatasetResourcesTable } from './DatasetResourcesTable';
import { DatasetInfo } from './DatasetInfo';
import { DiscussionSection } from '@/components/discussions/DiscussionSection';

interface DatasetTabsProps {
    dataset: Dataset;
}

export const DatasetTabs: React.FC<DatasetTabsProps> = ({ dataset }) => {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [reuses, setReuses] = useState<Reuse[]>([]);
    const [reuseCount, setReuseCount] = useState(dataset.metrics.reuses || 0);
    const [dataservices, setDataservices] = useState<Dataservice[]>([]);
    const [dataserviceCount, setDataserviceCount] = useState(0);
    const [communityResources, setCommunityResources] = useState<CommunityResource[]>([]);
    const [communityCount, setCommunityCount] = useState(0);

    useEffect(() => {
        async function loadTabData() {
            try {
                const [reuseResponse, dataserviceResponse, communityResponse] = await Promise.all([
                    fetchReuses(1, 20, { dataset: dataset.id }),
                    fetchDataservices(1, 20, { dataset: dataset.id }),
                    fetchCommunityResourcesByDataset(dataset.id),
                ]);
                setReuses(reuseResponse.data);
                setReuseCount(reuseResponse.total);
                setDataservices(dataserviceResponse.data);
                setDataserviceCount(dataserviceResponse.total);
                setCommunityResources(communityResponse.data);
                setCommunityCount(communityResponse.total);
            } catch (error) {
                console.error("Error loading tab data:", error);
            }
        }
        loadTabData();
    }, [dataset.id]);
    return (
        <div className="w-full">
            <Tabs>
                <Tab>
                    <TabHeader>Ficheiros ({dataset.resources.length})</TabHeader>
                    <TabBodyWrapper>
                        <DatasetResourcesTable resources={dataset.resources} />
                    </TabBodyWrapper>
                </Tab>
                <Tab>
                    <TabHeader>Reutilizações e APIs ({reuseCount + dataserviceCount})</TabHeader>
                    <TabBodyWrapper>
                        {dataserviceCount > 0 && (
                            <div className="mb-40">
                                <h3 className="font-medium text-neutral-900 text-base mb-16">
                                    {dataserviceCount} {dataserviceCount === 1 ? "API" : "APIS"}
                                </h3>
                                <div className="grid grid-cols-2 agora-card-links-datasets-px0 gap-32">
                                    {dataservices.map((ds) => (
                                        <DataserviceCardLinks key={ds.id} dataservice={ds} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <h3 className="font-medium text-neutral-900 text-base mb-16">
                                {reuseCount} {reuseCount === 1 ? "REUTILIZAÇÃO" : "REUTILIZAÇÕES"}
                            </h3>
                            {reuseCount === 0 ? (
                                <CardNoResults
                                    position="center"
                                    icon={
                                        <Icon name="agora-line-file" className="w-40 h-40 text-primary-500 icon-xl" />
                                    }
                                    title="Sem reutilizações"
                                    description="Ainda não existem reutilizações associadas a este conjunto de dados."
                                    hasAnchor={false}
                                    extraDescription={
                                        <div className="mt-24">
                                            <Link href="/pages/admin/reuses/new">
                                                <Button
                                                    variant="primary"
                                                    appearance="outline"
                                                    hasIcon={true}
                                                    leadingIcon="agora-line-plus-circle"
                                                    leadingIconHover="agora-solid-plus-circle"
                                                >
                                                    Adicione
                                                </Button>
                                            </Link>
                                        </div>
                                    }
                                />
                            ) : (
                                <div className="grid grid-cols-2 agora-card-links-datasets-px0 gap-32">
                                    {reuses.map((reuse) => (
                                        <ReuseCardLinks key={reuse.id} reuse={reuse} showDatasetsCount />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabBodyWrapper>
                </Tab>
                <Tab active={tabParam === 'discussions' || undefined}>
                    <TabHeader>Discussões ({dataset.metrics.discussions || 0})</TabHeader>
                    <TabBodyWrapper>
                        <DiscussionSection entityId={dataset.id} entityClass="Dataset" />
                    </TabBodyWrapper>
                </Tab>
                <Tab>
                    <TabHeader>
                        Recursos comunitários ({communityCount})
                    </TabHeader>
                    <TabBodyWrapper>
                        {communityCount === 0 ? (
                            <div className="bg-white rounded-8 py-64 px-32 flex flex-col items-center text-center">
                                <Icon name="agora-line-user-group" className="w-40 h-40 text-primary-500 icon-xl mb-16" />
                                <h3 className="text-primary-600 text-[2rem] leading-[3rem] mb-16" style={{ fontWeight: 300 }}>
                                    Sem recursos comunitários
                                </h3>
                                <p className="text-neutral-900 text-base font-normal mb-8">
                                    Atualmente, não existem recursos comunitários disponíveis para este conjunto de dados.
                                </p>
                                <div className="flex justify-center mt-32">
                                    <Link href={`/pages/admin/community-resources/new?dataset_id=${dataset.id}`}>
                                        <Button
                                            variant="primary"
                                            appearance="outline"
                                            hasIcon={true}
                                            leadingIcon="agora-line-plane"
                                            leadingIconHover="agora-solid-plane"
                                        >
                                            Partilhe
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-24">
                                    <StatusCard
                                        variant="informative"
                                        showIcon
                                        description="Estes recursos são publicados pela comunidade e não são da responsabilidade do produtor dos dados."
                                    />
                                </div>
                                <div className="flex items-center justify-between mb-16">
                                    <h3 className="font-medium text-neutral-900 text-base">
                                        {communityCount} {communityCount === 1 ? "RECURSO COMUNITÁRIO" : "RECURSOS COMUNITÁRIOS"}
                                    </h3>
                                    <Link href={`/pages/admin/community-resources/new?dataset_id=${dataset.id}`}>
                                        <Button
                                            variant="primary"
                                            appearance="outline"
                                            hasIcon={true}
                                            leadingIcon="agora-line-plane"
                                            leadingIconHover="agora-solid-plane"
                                        >
                                            Partilhe
                                        </Button>
                                    </Link>
                                </div>
                                <DatasetResourcesTable resources={[]} communityResources={communityResources} />
                            </div>
                        )}
                    </TabBodyWrapper>
                </Tab>
                <Tab>
                    <TabHeader>Informação</TabHeader>
                    <TabBodyWrapper>
                        <DatasetInfo dataset={dataset} />
                    </TabBodyWrapper>
                </Tab>
            </Tabs>
        </div>
    );
};