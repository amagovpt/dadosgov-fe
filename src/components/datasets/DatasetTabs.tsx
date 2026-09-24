'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
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
    const { t: tds } = useTranslation('datasets');
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [reuses, setReuses] = useState<Reuse[]>([]);
    const [reuseCount, setReuseCount] = useState(dataset.metrics.reuses || 0);
    const [dataservices, setDataservices] = useState<Dataservice[]>([]);
    const [dataserviceCount, setDataserviceCount] = useState(0);
    const [communityResources, setCommunityResources] = useState<CommunityResource[]>([]);
    const [communityCount, setCommunityCount] = useState(0);
    const [discussionCount, setDiscussionCount] = useState(dataset.metrics.discussions || 0);

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
                    <TabHeader>{tds('tabs.files', { count: dataset.resources.length })}</TabHeader>
                    <TabBodyWrapper>
                        <DatasetResourcesTable resources={dataset.resources} />
                    </TabBodyWrapper>
                </Tab>
                <Tab>
                    <TabHeader>
                        {tds('tabs.reusesAndApis', { count: reuseCount + dataserviceCount })}
                    </TabHeader>
                    <TabBodyWrapper>
                        {dataserviceCount > 0 && (
                            <div className="mb-40">
                                <h3 className="font-medium text-neutral-900 text-base mb-16">
                                    {tds('tabs.apisCount', { count: dataserviceCount })}
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
                                {tds('tabs.reusesCount', { count: reuseCount })}
                            </h3>
                            {reuseCount === 0 ? (
                                <CardNoResults
                                    position="center"
                                    icon={
                                        <Icon name="agora-line-file" className="w-40 h-40 text-primary-500 icon-xl" />
                                    }
                                    title={tds('tabs.noReuses.title')}
                                    description={tds('tabs.noReuses.description')}
                                    hasAnchor={false}
                                    extraDescription={
                                        <div className="mt-24">
                                            <Link href="/admin/reuses/new">
                                                <Button
                                                    variant="primary"
                                                    appearance="outline"
                                                    hasIcon={true}
                                                    leadingIcon="agora-line-plus-circle"
                                                    leadingIconHover="agora-solid-plus-circle"
                                                >
                                                    {tds('tabs.noReuses.cta')}
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
                    <TabHeader>
                        {tds('tabs.discussions', { count: discussionCount })}
                    </TabHeader>
                    <TabBodyWrapper>
                        <DiscussionSection
                            entityId={dataset.id}
                            entityClass="Dataset"
                            onCountChange={setDiscussionCount}
                        />
                    </TabBodyWrapper>
                </Tab>
                <Tab>
                    <TabHeader>
                        {tds('tabs.communityResources', { count: communityCount })}
                    </TabHeader>
                    <TabBodyWrapper>
                        {communityCount === 0 ? (
                            <div className="bg-white rounded-8 py-64 px-32 flex flex-col items-center text-center">
                                <Icon name="agora-line-user-group" className="w-40 h-40 text-primary-500 icon-xl mb-16" />
                                <h3 className="text-primary-600 text-[2rem] leading-[3rem] mb-16" style={{ fontWeight: 300 }}>
                                    {tds('tabs.noCommunity.title')}
                                </h3>
                                <p className="text-neutral-900 text-base font-normal mb-8">
                                    {tds('tabs.noCommunity.description')}
                                </p>
                                <div className="flex justify-center mt-32">
                                    <Link href={`/admin/community-resources/new?dataset_id=${dataset.id}`}>
                                        <Button
                                            variant="primary"
                                            appearance="outline"
                                            hasIcon={true}
                                            leadingIcon="agora-line-plane"
                                            leadingIconHover="agora-solid-plane"
                                        >
                                            {tds('tabs.noCommunity.cta')}
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
                                        description={tds('tabs.communityDisclaimer')}
                                    />
                                </div>
                                <div className="flex items-center justify-between mb-16">
                                    <h3 className="font-medium text-neutral-900 text-base">
                                        {tds('tabs.communityCount', { count: communityCount })}
                                    </h3>
                                    <Link href={`/admin/community-resources/new?dataset_id=${dataset.id}`}>
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
                    <TabHeader>{tds('tabs.info')}</TabHeader>
                    <TabBodyWrapper>
                        <DatasetInfo dataset={dataset} />
                    </TabBodyWrapper>
                </Tab>
            </Tabs>
        </div>
    );
};
