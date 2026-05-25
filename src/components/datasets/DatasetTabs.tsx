'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, Tab, TabHeader, TabBody, CardNoResults, CardLinks, Icon, StatusCard, Button } from '@ama-pt/agora-design-system';
import { Dataset, Reuse, CommunityResource } from '@/types/api';
import { fetchReuses, fetchCommunityResourcesByDataset } from '@/services/api';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
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
    const [communityResources, setCommunityResources] = useState<CommunityResource[]>([]);
    const [communityCount, setCommunityCount] = useState(0);

    useEffect(() => {
        async function loadTabData() {
            try {
                const [reuseResponse, communityResponse] = await Promise.all([
                    fetchReuses(1, 20, { dataset: dataset.id }),
                    fetchCommunityResourcesByDataset(dataset.id),
                ]);
                setReuses(reuseResponse.data);
                setReuseCount(reuseResponse.total);
                setCommunityResources(communityResponse.data);
                setCommunityCount(communityResponse.total);
            } catch (error) {
                console.error("Error loading tab data:", error);
            }
        }
        loadTabData();
    }, [dataset.id]);
    const renderTabBody = (content: React.ReactNode) => (
        <TabBody>
            <div className="relative">
                <div
                    className="absolute inset-y-0 -mx-4 sm:-mx-8 md:-mx-16 lg:-mx-32 xl:-mx-64 bg-primary-100 z-0"
                    aria-hidden="true"
                />
                <div className="relative z-10">
                    <div className="container mx-auto max-w-5xl">
                        {content}
                    </div>
                </div>
            </div>
        </TabBody>
    );

    return (
        <div className="w-full">
            <Tabs>
                <Tab>
                    <TabHeader>Ficheiros ({dataset.resources.length})</TabHeader>
                    {renderTabBody(<DatasetResourcesTable resources={dataset.resources} />)}
                </Tab>
                <Tab>
                    <TabHeader>Reutilizações ({reuseCount})</TabHeader>
                    {renderTabBody(
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
                                        <div key={reuse.id} className="h-full">
                                            <CardLinks
                                                onClick={() => window.location.href = `/pages/reuses/${reuse.slug}`}
                                                className="cursor-pointer text-neutral-900"
                                                variant="transparent"
                                                image={{
                                                    src: reuse.image_thumbnail || reuse.image || '/laptop.png',
                                                    alt: reuse.title,
                                                }}
                                                category={reuse.organization?.name || (reuse.owner ? `${reuse.owner.first_name} ${reuse.owner.last_name}`.trim() : 'Reutilização')}
                                                title={<div className="underline text-xl-bold">{reuse.title}</div>}
                                                description={
                                                    reuse.description ? (
                                                        <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-8 max-w-[592px]">
                                                            {reuse.description}
                                                        </p>
                                                    ) : undefined
                                                }
                                                date={
                                                    <span className="font-[300]">
                                                        Atualizado{' '}
                                                        {format(
                                                            new Date(reuse.last_modified || reuse.created_at),
                                                            'dd MM yyyy',
                                                            { locale: pt }
                                                        )}
                                                    </span>
                                                }
                                                links={[
                                                    {
                                                        href: '#',
                                                        hasIcon: true,
                                                        leadingIcon: 'agora-line-eye',
                                                        leadingIconHover: 'agora-solid-eye',
                                                        trailingIcon: '',
                                                        trailingIconHover: '',
                                                        trailingIconActive: '',
                                                        children: reuse.metrics?.views?.toLocaleString('pt-PT') || '0',
                                                        title: 'Visualizações',
                                                        onClick: (e: React.MouseEvent) => e.preventDefault(),
                                                        className: 'text-[#034AD8]',
                                                    },
                                                    {
                                                        href: '#',
                                                        hasIcon: true,
                                                        leadingIcon: 'agora-line-layers-menu',
                                                        leadingIconHover: 'agora-solid-layers-menu',
                                                        trailingIcon: '',
                                                        trailingIconHover: '',
                                                        trailingIconActive: '',
                                                        children: `${reuse.datasets?.length || 0} datasets`,
                                                        title: 'Datasets',
                                                        onClick: (e: React.MouseEvent) => e.preventDefault(),
                                                        className: 'text-[#034AD8]',
                                                    },
                                                    {
                                                        href: '#',
                                                        hasIcon: true,
                                                        leadingIcon: 'agora-line-star',
                                                        leadingIconHover: 'agora-solid-star',
                                                        trailingIcon: '',
                                                        trailingIconHover: '',
                                                        trailingIconActive: '',
                                                        children: reuse.metrics?.followers || 0,
                                                        title: 'Favoritos',
                                                        onClick: (e: React.MouseEvent) => e.preventDefault(),
                                                        className: 'text-[#034AD8]',
                                                    },
                                                ]}
                                                mainLink={
                                                    <Link href={`/pages/reuses/${reuse.slug}`}>
                                                        <span className="underline">{reuse.title}</span>
                                                    </Link>
                                                }
                                                blockedLink={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Tab>
                <Tab active={tabParam === 'discussions' || undefined}>
                    <TabHeader>Discussões ({dataset.metrics.discussions || 0})</TabHeader>
                    {renderTabBody(<DiscussionSection entityId={dataset.id} entityClass="Dataset" />)}
                </Tab>
                <Tab>
                    <TabHeader>
                        Recursos comunitários ({communityCount})
                    </TabHeader>
                    {renderTabBody(
                        communityCount === 0 ? (
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
                        )
                    )}
                </Tab>
                <Tab>
                    <TabHeader>Informação</TabHeader>
                    {renderTabBody(
                        <DatasetInfo dataset={dataset} />
                    )}
                </Tab>
            </Tabs>
        </div>
    );
};