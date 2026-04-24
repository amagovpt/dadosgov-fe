'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Avatar, Tabs, Tab, TabHeader, TabBody, CardNoResults, CardLinks, Icon, StatusCard, Button, InputSearchBar, InputText, InputTextArea, DropdownSection, DropdownOption, usePopupContext } from '@ama-pt/agora-design-system';
import { Dataset, Discussion, DiscussionCreatePayload, Reuse, CommunityResource } from '@/types/api';
import IsolatedSelect from '@/components/admin/IsolatedSelect';
import EditDiscussionPopup from '@/components/discussions/EditDiscussionPopup';
import DeleteDiscussionPopup from '@/components/discussions/DeleteDiscussionPopup';
import { fetchDiscussions, fetchReuses, fetchCommunityResourcesByDataset, createDiscussion, replyToDiscussion } from '@/services/api';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { DatasetResourcesTable } from './DatasetResourcesTable';
import { DatasetInfo } from './DatasetInfo';
import { useAuth } from '@/context/AuthContext';

interface ReplyFormProps {
    discId: string;
    user: NonNullable<ReturnType<typeof useAuth>['user']>;
    onClose: () => void;
    onSubmitted: (updated: Discussion) => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ discId, user, onClose, onSubmitted }) => {
    const [replyMessage, setReplyMessage] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const identityRef = useRef('');

    const identityOptions = React.useMemo(() => (
        <DropdownSection name="identity">
            <DropdownOption value="user">
                {user.first_name} {user.last_name} (utilizador)
            </DropdownOption>
            {user.organizations.map((org) => (
                <DropdownOption key={org.id} value={org.id}>
                    {org.name}
                </DropdownOption>
            ))}
        </DropdownSection>
    ), [user]);

    return (
        <div className="mt-48 pt-32">
            <div className="flex justify-between items-center mb-24">
                <h4 className="font-bold text-neutral-900 text-sm uppercase">Responder</h4>
                <Button
                    variant="primary"
                    appearance="outline"
                    hasIcon
                    leadingIcon="agora-line-x"
                    leadingIconHover="agora-solid-x"
                    onClick={onClose}
                >
                    Fechar
                </Button>
            </div>
            {user.organizations && user.organizations.length > 0 && (
                <div className="mb-32">
                    <span className="block text-sm font-medium text-neutral-900 mb-8">
                        Escolha a identidade com a qual deseja publicar esta mensagem
                    </span>
                    <IsolatedSelect
                        label=""
                        hideLabel
                        placeholder="Para pesquisar..."
                        id={`reply-identity-${discId}`}
                        onChangeRef={identityRef}
                        searchable
                        searchInputPlaceholder="Para pesquisar..."
                        searchNoResultsText="Sem resultados"
                    >
                        {identityOptions}
                    </IsolatedSelect>
                </div>
            )}
            <div className="mb-32">
                <InputTextArea
                    label="A sua mensagem"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                    placeholder="Por favor, mantenha a cordialidade e a postura construtiva. Evite compartilhar informações pessoais."
                />
            </div>
            <div className="flex justify-end gap-16">
                <Button
                    variant="primary"
                    appearance="solid"
                    disabled={isReplying || !replyMessage.trim()}
                    onClick={async () => {
                        setIsReplying(true);
                        const org = identityRef.current && identityRef.current !== 'user' ? identityRef.current : undefined;
                        const updated = await replyToDiscussion(discId, replyMessage.trim(), { organization: org });
                        if (updated) {
                            onSubmitted(updated);
                        }
                        setIsReplying(false);
                    }}
                >
                    Responder
                </Button>
            </div>
        </div>
    );
};

interface DatasetTabsProps {
    dataset: Dataset;
}

export const DatasetTabs: React.FC<DatasetTabsProps> = ({ dataset }) => {
    const { user } = useAuth();
    const { show, hide } = usePopupContext();
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [discussionCount, setDiscussionCount] = useState(dataset.metrics.discussions || 0);
    const [reuses, setReuses] = useState<Reuse[]>([]);
    const [reuseCount, setReuseCount] = useState(dataset.metrics.reuses || 0);
    const [showNewDiscussion, setShowNewDiscussion] = useState(false);
    const [newDiscTitle, setNewDiscTitle] = useState('');
    const [newDiscMessage, setNewDiscMessage] = useState('');
    const selectedIdentityRef = useRef('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [discussionSearch, setDiscussionSearch] = useState('');
    const [communityResources, setCommunityResources] = useState<CommunityResource[]>([]);
    const [communityCount, setCommunityCount] = useState(0);

    const handleCreateDiscussion = async () => {
        if (!newDiscTitle.trim() || !newDiscMessage.trim()) return;
        setIsSubmitting(true);
        try {
            const payload: DiscussionCreatePayload = {
                title: newDiscTitle.trim(),
                comment: newDiscMessage.trim(),
                subject: {
                    class: 'Dataset',
                    id: dataset.id,
                },
                ...(selectedIdentityRef.current && selectedIdentityRef.current !== 'user'
                    ? { organization: selectedIdentityRef.current } : {}),
            };
            const created = await createDiscussion(payload);
            if (created) {
                setDiscussions((prev) => [created, ...prev]);
                setDiscussionCount((prev) => prev + 1);
                setNewDiscTitle('');
                setNewDiscMessage('');
                setShowNewDiscussion(false);
            }
        } catch (error) {
            console.error('Error creating discussion:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        async function loadTabData() {
            try {
                const [discResponse, reuseResponse, communityResponse] = await Promise.all([
                    fetchDiscussions(dataset.id),
                    fetchReuses(1, 20, { dataset: dataset.id }),
                    fetchCommunityResourcesByDataset(dataset.id),
                ]);
                setDiscussions(discResponse.data);
                setDiscussionCount(discResponse.total);
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
        <div className="mt-64">
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
                                        <Icon name="agora-line-file" className="w-[40px] h-[40px] text-primary-500 icon-xl" />
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
                                                        <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-[8px] max-w-[592px]">
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
                <Tab>
                    <TabHeader>Discussões ({discussionCount})</TabHeader>
                    {renderTabBody(
                        <div>
                            <div className="flex items-center justify-between mb-24">
                                <h3 className="font-medium text-neutral-900 text-base">
                                    {discussionCount} {discussionCount === 1 ? "DISCUSSÃO" : "DISCUSSÕES"}
                                </h3>
                                <div className="flex items-center gap-24">
                                    <InputSearchBar
                                        hasVoiceActionButton={false}
                                        placeholder="Pesquisar"
                                        aria-label="Pesquisar discussões"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setDiscussionSearch(e.target.value)
                                        }
                                    />
                                    <Button
                                        variant="primary"
                                        appearance="outline"
                                        hasIcon={true}
                                        leadingIcon="agora-line-plus-circle"
                                        leadingIconHover="agora-solid-plus-circle"
                                        className="self-stretch"
                                        onClick={() => {
                                            if (!user) {
                                                window.location.href = "/pages/login";
                                            } else {
                                                setShowNewDiscussion(!showNewDiscussion);
                                            }
                                        }}
                                    >
                                        Iniciar nova discussão
                                    </Button>
                                </div>
                            </div>
                            {/* New discussion form */}
                            {showNewDiscussion && (
                                <div className="bg-white rounded-8 p-32 mb-24">
                                    <div className="flex justify-between items-center mb-16">
                                        <h3 className="font-bold text-neutral-900 text-base">
                                            Nova discussão
                                        </h3>
                                        <Button
                                            variant="primary"
                                            appearance="outline"
                                            hasIcon
                                            leadingIcon="agora-line-x"
                                            leadingIconHover="agora-solid-x"
                                            onClick={() => setShowNewDiscussion(false)}
                                        >
                                            Fechar
                                        </Button>
                                    </div>
                                    <p className="text-sm text-neutral-900 mb-16">
                                        Os campos marcados com um asterisco (<span className="text-red-500">*</span>) são obrigatórios.
                                    </p>
                                    {user?.organizations && user.organizations.length > 0 && (
                                        <div className="mb-24">
                                            <span className="block text-sm font-medium text-neutral-900 mb-8">
                                                Escolha a identidade com a qual deseja publicar esta mensagem
                                            </span>
                                            <IsolatedSelect
                                                label=""
                                                hideLabel
                                                placeholder="Para pesquisar..."
                                                id="discussion-identity"
                                                onChangeRef={selectedIdentityRef}
                                                searchable
                                                searchInputPlaceholder="Para pesquisar..."
                                                searchNoResultsText="Sem resultados"
                                            >
                                                <DropdownSection name="identity">
                                                    <DropdownOption value="user">
                                                        {user.first_name} {user.last_name} (utilizador)
                                                    </DropdownOption>
                                                    {user.organizations.map((org) => (
                                                        <DropdownOption key={org.id} value={org.id}>
                                                            {org.name}
                                                        </DropdownOption>
                                                    ))}
                                                </DropdownSection>
                                            </IsolatedSelect>
                                        </div>
                                    )}
                                    <div className="mb-24">
                                        <InputText
                                            label="Título *"
                                            value={newDiscTitle}
                                            onChange={(e) => setNewDiscTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-24">
                                        <InputTextArea
                                            label="A sua mensagem *"
                                            value={newDiscMessage}
                                            onChange={(e) => setNewDiscMessage(e.target.value)}
                                            rows={4}
                                            placeholder="Por favor, mantenha a cordialidade e uma postura construtiva. Evite partilhar informações pessoais."
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            variant="primary"
                                            appearance="solid"
                                            onClick={handleCreateDiscussion}
                                            disabled={isSubmitting || !newDiscTitle.trim() || !newDiscMessage.trim()}
                                        >
                                            {isSubmitting ? 'A enviar...' : 'Enviar'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {discussionCount === 0 ? (
                                <CardNoResults
                                    position="center"
                                    icon={
                                        <Icon name="agora-line-chat" className="w-[40px] h-[40px] text-primary-500 icon-xl" />
                                    }
                                    title="Sem discussões"
                                    description="Ainda não existem discussões sobre este conjunto de dados."
                                    hasAnchor={false}
                                />
                            ) : (
                                <div className="flex flex-col gap-32 mt-24">
                                    {discussions.filter((disc) =>
                                        disc.title.toLowerCase().includes(discussionSearch.toLowerCase())
                                    ).map((disc) => (
                                        <div key={disc.id} className="bg-white rounded-8 p-32">
                                            {/* First message / topic */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-neutral-900 text-base mb-16">{disc.title}</h4>
                                                    <div className="flex items-center gap-8">
                                                        <Avatar
                                                            avatarType={disc.user.avatar_thumbnail ? "image" : "initials"}
                                                            srcPath={
                                                                (disc.user.avatar_thumbnail ||
                                                                    `${disc.user.first_name?.charAt(0).toUpperCase() ?? ""}${disc.user.last_name?.charAt(0).toUpperCase() ?? ""}`) as unknown as undefined
                                                            }
                                                            alt={`${disc.user.first_name} ${disc.user.last_name}`}
                                                        />
                                                        <p className="text-sm text-neutral-900">
                                                            <span className="text-primary-600 font-medium">
                                                                {disc.user.first_name} {disc.user.last_name}
                                                            </span>
                                                            {' — Publicado em '}
                                                            {format(new Date(disc.created), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-[18px]">
                                                    {disc.permissions.edit && (
                                                        <Button
                                                            variant="primary"
                                                            appearance="outline"
                                                            hasIcon
                                                            iconOnly
                                                            leadingIcon="agora-line-edit"
                                                            leadingIconHover="agora-solid-edit"
                                                            aria-label="Editar discussão"
                                                            onClick={() => show(
                                                                <EditDiscussionPopup discussion={disc} commentIndex={0} onUpdated={(updated) => setDiscussions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))} />,
                                                                { title: "Editar a mensagem", closeAriaLabel: "Fechar", dimensions: "m" }
                                                            )}
                                                        >
                                                            {" "}
                                                        </Button>
                                                    )}
                                                    {disc.permissions.delete && (
                                                        <Button
                                                            variant="danger"
                                                            appearance="outline"
                                                            hasIcon
                                                            iconOnly
                                                            leadingIcon="agora-line-trash"
                                                            leadingIconHover="agora-solid-trash"
                                                            aria-label="Eliminar discussão"
                                                            onClick={() => show(
                                                                <DeleteDiscussionPopup discussion={disc} commentIndex={0} onDeleted={() => { setDiscussions((prev) => prev.filter((d) => d.id !== disc.id)); setDiscussionCount((prev) => prev - 1); }} />,
                                                                { title: "Tem certeza de que deseja eliminar esta discussão?", closeAriaLabel: "Fechar", dimensions: "l" }
                                                            )}
                                                        >
                                                            {" "}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            {disc.discussion.length > 0 && (
                                                <p className="text-neutral-900 text-sm mt-16 mb-16 max-w-[100ch]">
                                                    {disc.discussion[0].content}
                                                </p>
                                            )}
                                            {/* Replies */}
                                            {disc.discussion.length > 1 && (
                                                <div className="mt-16 pt-16 border-l-2 border-primary-600 pl-32 flex flex-col gap-24">
                                                    {disc.discussion.slice(1).map((msg, idx) => (
                                                        <div key={idx}>
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex items-center gap-8">
                                                                    <Avatar
                                                                        avatarType={msg.posted_by.avatar_thumbnail ? "image" : "initials"}
                                                                        srcPath={
                                                                            (msg.posted_by.avatar_thumbnail ||
                                                                                `${msg.posted_by.first_name?.charAt(0).toUpperCase() ?? ""}${msg.posted_by.last_name?.charAt(0).toUpperCase() ?? ""}`) as unknown as undefined
                                                                        }
                                                                        alt={`${msg.posted_by.first_name} ${msg.posted_by.last_name}`}
                                                                    />
                                                                    <p className="text-sm text-neutral-900">
                                                                        <span className="text-primary-600 font-medium">
                                                                            {msg.posted_by.first_name} {msg.posted_by.last_name}
                                                                        </span>
                                                                        {' — '}
                                                                        {format(new Date(msg.posted_on), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-[18px]">
                                                                    {msg.permissions.edit && (
                                                                        <Button
                                                                            variant="primary"
                                                                            appearance="outline"
                                                                            hasIcon
                                                                            iconOnly
                                                                            leadingIcon="agora-line-edit"
                                                                            leadingIconHover="agora-solid-edit"
                                                                            aria-label="Editar comentário"
                                                                            onClick={() => show(
                                                                                <EditDiscussionPopup discussion={disc} commentIndex={idx + 1} onUpdated={(updated) => setDiscussions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))} />,
                                                                                { title: "Editar a mensagem", closeAriaLabel: "Fechar", dimensions: "m" }
                                                                            )}
                                                                        >
                                                                            {" "}
                                                                        </Button>
                                                                    )}
                                                                    {msg.permissions.delete && (
                                                                        <Button
                                                                            variant="danger"
                                                                            appearance="outline"
                                                                            hasIcon
                                                                            iconOnly
                                                                            leadingIcon="agora-line-trash"
                                                                            leadingIconHover="agora-solid-trash"
                                                                            aria-label="Eliminar comentário"
                                                                            onClick={() => show(
                                                                                <DeleteDiscussionPopup discussion={disc} commentIndex={idx + 1} onDeleted={() => setDiscussions((prev) => prev.map((d) => d.id === disc.id ? { ...d, discussion: d.discussion.filter((_, i) => i !== idx + 1) } : d))} />,
                                                                                { title: "Tem certeza de que deseja apagar esta mensagem?", closeAriaLabel: "Fechar", dimensions: "l" }
                                                                            )}
                                                                        >
                                                                            {" "}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-neutral-900 text-sm mt-4 max-w-[100ch]">
                                                                {msg.content}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {replyingTo === disc.id && user ? (
                                                <ReplyForm
                                                    discId={disc.id}
                                                    user={user}
                                                    onClose={() => setReplyingTo(null)}
                                                    onSubmitted={(updated) => {
                                                        setDiscussions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
                                                        setReplyingTo(null);
                                                    }}
                                                />
                                            ) : user ? (
                                                <div className="flex justify-end" style={{ marginTop: "32px" }}>
                                                    <Button
                                                        variant="primary"
                                                        appearance="outline"
                                                        onClick={() => setReplyingTo(disc.id)}
                                                    >
                                                        Responder
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Tab>
                <Tab>
                    <TabHeader>
                        Recursos comunitários ({communityCount})
                    </TabHeader>
                    {renderTabBody(
                        communityCount === 0 ? (
                            <div className="bg-white rounded-8 py-64 px-32 flex flex-col items-center text-center">
                                <Icon name="agora-line-user-group" className="w-[40px] h-[40px] text-primary-500 icon-xl mb-16" />
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
                                        type="info"
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
