'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Breadcrumb,
  Button,
  Icon,
  Pill,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  CardArticle,
  CardGeneral,
  CardLinks,
  CardNoResults,
  ProgressBar,
  SearchPagination,
  StatusCard,
  InputSearchBar,
  InputText,
  InputTextArea,
  DropdownSection,
  DropdownOption,
  usePopupContext,
} from '@ama-pt/agora-design-system';
import { Reuse, Dataset, Discussion, DiscussionCreatePayload } from '@/types/api';
import { fetchDataset, fetchReuse, fetchDiscussions, createDiscussion, replyToDiscussion } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import IsolatedSelect from '@/components/admin/IsolatedSelect';
import EditDiscussionPopup from '@/components/discussions/EditDiscussionPopup';
import DeleteDiscussionPopup from '@/components/discussions/DeleteDiscussionPopup';

import { format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

const REUSE_TYPE_LABELS: Record<string, string> = {
  visualization: "Visualização",
  application: "Aplicação",
  blog_post: "Publicação no blog",
  press_article: "Artigo de imprensa",
  api: "API",
  idea: "Ideia",
  hardware: "Hardware conectado",
};

interface ReuseDetailClientProps {
  slug: string;
}

export default function ReuseDetailClient({ slug }: ReuseDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { show, hide } = usePopupContext();
  const [reuse, setReuse] = useState<Reuse | null>(null);
  const [isLoadingReuse, setIsLoadingReuse] = useState(true);
  const [fullDatasets, setFullDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionCount, setDiscussionCount] = useState(0);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscMessage, setNewDiscMessage] = useState('');
  const selectedIdentityRef = useRef('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const replyIdentityRef = useRef('');
  const [isReplying, setIsReplying] = useState(false);

  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflowing, setDescOverflowing] = useState(false);
  const [descAvailableHeight, setDescAvailableHeight] = useState<number | undefined>(undefined);
  const descMeasureRef = useRef<HTMLDivElement>(null);
  const descTitleRef = useRef<HTMLDivElement>(null);
  const descSidebarRef = useRef<HTMLDivElement>(null);
  const READMORE_BUTTON_HEIGHT = 48;

  const checkDescOverflow = useCallback(() => {
    if (descMeasureRef.current && descSidebarRef.current && descTitleRef.current) {
      const sidebarHeight = descSidebarRef.current.offsetHeight;
      const titleHeight = descTitleRef.current.offsetHeight;
      const fullHeight = descMeasureRef.current.offsetHeight;
      const maxDescHeight = sidebarHeight - titleHeight;
      const overflows = fullHeight > maxDescHeight;
      if (overflows) {
        const lineHeight = parseFloat(getComputedStyle(descMeasureRef.current).lineHeight) || 24;
        const usable = maxDescHeight - READMORE_BUTTON_HEIGHT;
        const snapped = Math.floor(usable / lineHeight) * lineHeight;
        setDescAvailableHeight(snapped);
      } else {
        setDescAvailableHeight(maxDescHeight);
      }
      setDescOverflowing(overflows);
    }
  }, []);

  useEffect(() => {
    checkDescOverflow();
    window.addEventListener("resize", checkDescOverflow);
    const observer = new ResizeObserver(checkDescOverflow);
    if (descSidebarRef.current) observer.observe(descSidebarRef.current);
    if (descMeasureRef.current) observer.observe(descMeasureRef.current);
    return () => {
      window.removeEventListener("resize", checkDescOverflow);
      observer.disconnect();
    };
  }, [checkDescOverflow, reuse]);

  const handleCreateDiscussion = async () => {
    if (!reuse || !newDiscTitle.trim() || !newDiscMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const payload: DiscussionCreatePayload = {
        title: newDiscTitle.trim(),
        comment: newDiscMessage.trim(),
        subject: {
          class: 'Reuse',
          id: reuse.id,
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
    async function loadReuse() {
      try {
        const data = await fetchReuse(slug);
        setReuse(data);
      } catch (error) {
        console.error("Error loading reuse:", error);
      } finally {
        setIsLoadingReuse(false);
      }
    }
    loadReuse();
  }, [slug]);
  const [datasetsPage, setDatasetsPage] = useState(1);
  const datasetsPageSize = 6;

  const datasetRefs = reuse?.datasets || [];

  useEffect(() => {
    if (!reuse || datasetRefs.length === 0) {
      setIsLoadingDatasets(false);
      return;
    }

    async function loadDatasets() {
      try {
        const slugs = datasetRefs.map((d) =>
          d.uri.split('/').filter(Boolean).pop() || d.id
        );
        const results = await Promise.all(
          slugs.map((s) => fetchDataset(s).catch(() => null))
        );
        setFullDatasets(results.filter((d): d is Dataset => d !== null));
      } catch {
        setFullDatasets([]);
      } finally {
        setIsLoadingDatasets(false);
      }
    }

    loadDatasets();
  }, [reuse]);

  useEffect(() => {
    if (!reuse) return;
    async function loadDiscussions() {
      try {
        const response = await fetchDiscussions(reuse!.id);
        setDiscussions(response.data || []);
        setDiscussionCount(response.total || 0);
      } catch (error) {
        console.error("Error loading discussions:", error);
      }
    }
    loadDiscussions();
  }, [reuse]);

  if (isLoadingReuse) {
    return <p className="text-neutral-900 text-base p-32">A carregar...</p>;
  }

  if (!reuse) {
    return <p className="text-neutral-900 text-base p-32">Reutilização não encontrada.</p>;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: pt });
    } catch {
      return dateString;
    }
  };

  const totalDatasetsPages = Math.ceil(fullDatasets.length / datasetsPageSize);
  const paginatedDatasets = fullDatasets.slice(
    (datasetsPage - 1) * datasetsPageSize,
    datasetsPage * datasetsPageSize
  );

  const renderDatasetsPagination = () => {
    if (totalDatasetsPages <= 1) return null;
    return (
      <div className="mt-32 flex justify-center">
        <SearchPagination
          totalPages={totalDatasetsPages}
          onChange={(page: number) => setDatasetsPage(page + 1)}
          label="Paginação"
          nextPageAriaLabel="Próxima página"
          previousPageAriaLabel="Página anterior"
          boundaryCount={1}
          siblingCount={1}
        />
      </div>
    );
  };

  const renderTabBody = (content: React.ReactNode) => (
    <TabBody>
      <div className="relative">
        <div
          className="absolute inset-y-0 -mx-4 sm:-mx-8 md:-mx-16 lg:-mx-32 xl:-mx-64 bg-neutral-50 z-0"
          aria-hidden="true"
        />
        <div className="relative z-10 ">
          <div className="container mx-auto">{content}</div>
        </div>
      </div>
    </TabBody>
  );

  return (
    <div className="flex flex-col font-sans text-neutral-900 bg-white min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-white text-neutral-900 pt-24 pb-48 sm:pb-64">
        <div className="container mx-auto px-4 sm:px-16 md:px-32 lg:px-64">
          {/* Breadcrumbs & Actions */}
          <div className="mb-24">
            <div className="mb-24">
              <Breadcrumb
                darkMode={false}
                items={[
                  { label: 'Home', url: '/' },
                  { label: 'Reutilizações', url: '/pages/reuses' },
                  {
                    label: reuse.title,
                    url: `/pages/reuses/${reuse.slug || reuse.id}`,
                  },
                ]}
              />
            </div>
            <div className="flex justify-end">
              <div className="flex flex-wrap items-center gap-16">
                <Button
                  variant="primary"
                  appearance="outline"
                  darkMode={false}
                  hasIcon={true}
                  leadingIcon="agora-line-star"
                  leadingIconHover="agora-solid-star"
                >
                  Adicionar aos favoritos
                </Button>
                <Button
                  variant="primary"
                  hasIcon={true}
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-line-external-link"
                  onClick={() => window.open(reuse.url, '_blank')}
                >
                  Veja reutilização
                </Button>
              </div>
            </div>
          </div>

          {/* Owner line */}
          {reuse.owner && (
            <p className="admin-edit-info__activity">
              <Icon name="agora-line-user" className="admin-edit-info__clock-icon" />
              {" Criado por: "}
              <Link
                href={`/pages/users/${reuse.owner.slug}`}
                className="text-primary-600 underline"
              >
                {reuse.owner.first_name} {reuse.owner.last_name}
              </Link>
            </p>
          )}

          {/* Hero Content */}
          <div className="grid md:grid-cols-3 xl:grid-cols-12 gap-32 mt-6 mb-24">
            {/* Image Column */}
            <div className="xl:col-span-8">
              <div className=" w-full">
                <img
                  src={reuse.image || '/laptop.png'}
                  alt={reuse.title}
                  className="w-full rounded-[4px]"
                  style={{ height: '308px', objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Card Column */}
            <div className="xl:col-span-4 card-article-3_2">
              <CardArticle
                className="bg-[#F2F6FF]! border-none shadow-none [&_.container-body]:p-32 [&_.container-body]:flex [&_.container-body]:flex-col"
                title={reuse.title}
                subtitle={
                  <div className="flex flex-col gap-24 mb-16">
                    {reuse.organization?.logo ? (
                      <div className="w-fit h-[48px] card-article-3_2-img py-8 rounded-8 border-2 border-primary-300 flex items-center justify-center">
                        <img
                          src={reuse.organization.logo}
                          alt={reuse.organization.name}
                        />
                      </div>
                    ) : (
                      <div className="w-[160px] h-[56px] bg-white rounded-8 border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 text-xs font-bold uppercase tracking-wider shadow-sm">
                        {reuse.organization?.name || 'Sem organização'}
                      </div>
                    )}
                    {reuse.organization && (
                      <Link
                        href={`/pages/organizations/${reuse.organization.slug}`}
                        className="text-sm font-medium underline text-primary-600 hover:text-primary-800"
                      >
                        {reuse.organization.name}
                      </Link>
                    )}
                  </div>
                }
              >
                <div className="flex flex-col gap-24 h-full">
                  <div className="flex items-center flex-wrap gap-16 text-[15px]">
                    <span className="font-semibold text-neutral-900">
                      {REUSE_TYPE_LABELS[reuse.type] || reuse.type || 'Aplicação'}
                    </span>
                    <div className="flex items-center gap-8">
                      <Icon
                        name="agora-line-eye"
                        className="w-20 h-20 fill-[var(--color-neutral-900)]"
                      />
                      <span className="text-neutral-900">
                        {reuse.metrics?.views
                          ? reuse.metrics.views >= 1000
                            ? (reuse.metrics.views / 1000).toFixed(0) + ' mil'
                            : reuse.metrics.views
                          : '0'}
                      </span>
                    </div>
                    <div className="flex items-center gap-8">
                      <Icon
                        name="agora-line-layers-menu"
                        className="w-20 h-20 fill-[var(--color-neutral-900)]"
                      />
                      <span className="text-neutral-900">{datasetRefs.length}</span>
                    </div>
                  </div>

                </div>
              </CardArticle>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="bg-white sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-16 md:px-32 lg:px-64">
          <Tabs>
            <Tab>
              <TabHeader>Descrição</TabHeader>
              {renderTabBody(
                <div className="grid md:grid-cols-3 xl:grid-cols-12 gap-32 mt-6">
                  {/* Main Content */}
                  <div className="xl:col-span-8 max-w-ch">
                    <div className="prose prose-lg max-w-none text-neutral-700 leading-relaxed relative">
                      <div ref={descTitleRef}>
                        <h2 className="font-medium text-base text-neutral-900 uppercase mb-32">Descrição</h2>
                      </div>
                      {/* Hidden measure element */}
                      <div ref={descMeasureRef} className="absolute invisible pointer-events-none" style={{ top: 0, left: 0, right: 0 }} aria-hidden="true">
                        <div
                          className="mb-32 text-neutral-900 [&_a]:underline [&_a]:text-primary-600"
                          dangerouslySetInnerHTML={{ __html: reuse.description }}
                        />
                      </div>
                      <div
                        className="overflow-hidden"
                        style={!descExpanded && descOverflowing && descAvailableHeight ? { maxHeight: descAvailableHeight } : undefined}
                      >
                        <div
                          className="mb-32 text-neutral-900 [&_a]:underline [&_a]:text-primary-600"
                          dangerouslySetInnerHTML={{ __html: reuse.description }}
                        />
                      </div>
                      {descOverflowing && (
                        <button
                          onClick={() => setDescExpanded(!descExpanded)}
                          className="flex items-center gap-8 text-primary-600 cursor-pointer hover:underline mt-8"
                        >
                          {descExpanded ? "Ler menos" : "Ler mais"}
                          {descExpanded ? (
                            <Icon name="agora-line-arrow-up-circle" className="w-24 h-24" />
                          ) : (
                            <Icon name="agora-line-arrow-down-circle" className="w-24 h-24" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sidebar Metadata */}
                  <aside className="xl:col-span-4 xl:block md:pt-64 flex flex-col gap-16" ref={descSidebarRef}>
                    {reuse.tags && reuse.tags.length > 0 && (
                      <div className="bg-white p-32 rounded-4">
                        <h3 className="text-sm font-bold tracking-wider mb-8">Etiquetas</h3>
                        <div className="flex flex-col items-start gap-8">
                          {reuse.tags.map((tag) => (
                            <Pill
                              key={tag}
                              appearance="solid"
                              variant="primary"
                              className="bg-primary-100 text-primary-700 h-auto py-4 px-8 text-xs font-semibold"
                            >
                              {tag}
                            </Pill>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-white p-32 rounded-4">
                      <h3 className="text-sm font-bold tracking-wider mb-8">
                        Última atualização
                      </h3>
                      <p className="font-medium text-neutral-900">
                        {formatDate(reuse.last_modified)}
                      </p>
                    </div>

                    <div className="bg-white p-32 rounded-4">
                      <h3 className="text-sm font-bold tracking-wider mb-8">
                        Data de criação
                      </h3>
                      <p className="font-medium text-neutral-900">
                        {formatDate(reuse.created_at)}
                      </p>
                    </div>

                  </aside>
                </div>
              )}
            </Tab>
            <Tab>
              <TabHeader>Discussões ({discussionCount})</TabHeader>
              {renderTabBody(
                <div>
                  <div className="mb-24">
                    <StatusCard
                      type="info"
                      description="A sua questão não é sobre a reutilização?"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-24">
                    <h3 className="font-medium text-neutral-900 text-base">
                      {discussionCount} {discussionCount === 1 ? "DISCUSSÃO" : "DISCUSSÕES"}
                    </h3>
                    <div className="flex items-center gap-24">
                      <InputSearchBar
                        hasVoiceActionButton={false}
                        placeholder="Pesquisar"
                        aria-label="Pesquisar discussões"
                      />
                      <Button
                        variant="primary"
                        appearance="outline"
                        hasIcon={true}
                        leadingIcon="agora-line-plus-circle"
                        leadingIconHover="agora-solid-plus-circle"
                        onClick={() => setShowNewDiscussion(!showNewDiscussion)}
                      >
                        Nova discussão
                      </Button>
                    </div>
                  </div>
                  {showNewDiscussion && (
                    <div className="bg-white rounded-8 p-32 mb-24">
                      <div className="flex justify-between items-center mb-16">
                        <h3 className="font-bold text-neutral-900 text-base">Nova discussão</h3>
                        <Button variant="primary" appearance="outline" hasIcon leadingIcon="agora-line-x" leadingIconHover="agora-solid-x" onClick={() => setShowNewDiscussion(false)}>
                          Fechar
                        </Button>
                      </div>
                      <p className="text-sm text-neutral-900 mb-16">
                        Os campos marcados com um asterisco (<span className="text-red-500">*</span>) são obrigatórios.
                      </p>
                      {user?.organizations && user.organizations.length > 0 && (
                        <div className="mb-24">
                          <span className="block text-sm font-medium text-neutral-900 mb-8">
                            Escolha a identidade com a qual deseja publicar esta mensagem.
                          </span>
                          <IsolatedSelect label="" hideLabel placeholder="Para pesquisar..." id="discussion-identity-reuse" onChangeRef={selectedIdentityRef} searchable searchInputPlaceholder="Para pesquisar..." searchNoResultsText="Sem resultados">
                            <DropdownSection name="identity">
                              <DropdownOption value="user">{user.first_name} {user.last_name} (utilizador)</DropdownOption>
                              {user.organizations.map((org) => (
                                <DropdownOption key={org.id} value={org.id}>{org.name}</DropdownOption>
                              ))}
                            </DropdownSection>
                          </IsolatedSelect>
                        </div>
                      )}
                      <div className="mb-24">
                        <InputText label="Título *" value={newDiscTitle} onChange={(e) => setNewDiscTitle(e.target.value)} required />
                      </div>
                      <div className="mb-24">
                        <InputTextArea label="Mensagem *" value={newDiscMessage} onChange={(e) => setNewDiscMessage(e.target.value)} rows={4} placeholder="Mantenha a cordialidade e postura construtiva. Não partilhe informações pessoais." required />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="primary" appearance="solid" onClick={handleCreateDiscussion} disabled={isSubmitting || !newDiscTitle.trim() || !newDiscMessage.trim()}>
                          {isSubmitting ? 'A enviar...' : 'Enviar'}
                        </Button>
                      </div>
                    </div>
                  )}
                  {discussionCount === 0 ? (
                    <CardNoResults position="center" icon={<Icon name="agora-line-chat" className="w-[40px] h-[40px] text-primary-500 icon-xl" />} title="Ainda não há discussão." description="" hasAnchor={false} />
                  ) : (
                    <div className="flex flex-col gap-32">
                      {discussions.map((disc) => (
                        <div key={disc.id} className="bg-white rounded-8 p-32">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-bold text-neutral-900 text-base">{disc.title}</h4>
                              <p className="text-sm text-neutral-900 mt-4">
                                <span className="text-primary-600 font-medium">{disc.user.first_name} {disc.user.last_name}</span>
                                {' — Publicado em '}
                                {format(new Date(disc.created), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                              </p>
                            </div>
                            <div className="flex gap-8">
                              <Button variant="primary" appearance="outline" hasIcon iconOnly leadingIcon="agora-line-edit" leadingIconHover="agora-solid-edit" aria-label="Editar discussão" onClick={() => show(<EditDiscussionPopup discussion={disc} commentIndex={0} onUpdated={(updated) => setDiscussions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))} />, { title: "Editar a mensagem", closeAriaLabel: "Fechar", dimensions: "m" })}>{" "}</Button>
                              <Button variant="danger" appearance="solid" hasIcon iconOnly leadingIcon="agora-line-trash" leadingIconHover="agora-solid-trash" aria-label="Eliminar discussão" onClick={() => show(<DeleteDiscussionPopup discussion={disc} commentIndex={0} onDeleted={() => { setDiscussions((prev) => prev.filter((d) => d.id !== disc.id)); setDiscussionCount((prev) => prev - 1); }} />, { title: "Tem certeza de que deseja eliminar esta discussão?", closeAriaLabel: "Fechar", dimensions: "m" })}>{" "}</Button>
                            </div>
                          </div>
                          {disc.discussion.length > 0 && (
                            <p className="text-neutral-900 text-sm mt-16 mb-16">{disc.discussion[0].content}</p>
                          )}
                          {disc.discussion.length > 1 && (
                            <div className="mt-16 space-y-16 border-t border-neutral-200 pt-16">
                              {disc.discussion.slice(1).map((msg, idx) => (
                                <div key={idx} className="border-l-2 border-primary-600" style={{ paddingLeft: "24px" }}>
                                  <div className="flex justify-between items-start">
                                    <p className="text-sm text-neutral-900">
                                      <span className="text-primary-600 font-medium">{msg.posted_by.first_name} {msg.posted_by.last_name}</span>
                                      {' — '}
                                      {format(new Date(msg.posted_on), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                                    </p>
                                    <div className="flex gap-8">
                                      <Button variant="primary" appearance="outline" hasIcon iconOnly leadingIcon="agora-line-edit" leadingIconHover="agora-solid-edit" aria-label="Editar comentário" onClick={() => show(<EditDiscussionPopup discussion={disc} commentIndex={idx + 1} onUpdated={(updated) => setDiscussions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))} />, { title: "Editar a mensagem", closeAriaLabel: "Fechar", dimensions: "m" })}>{" "}</Button>
                                      <Button variant="danger" appearance="solid" hasIcon iconOnly leadingIcon="agora-line-trash" leadingIconHover="agora-solid-trash" aria-label="Eliminar comentário" onClick={() => show(<DeleteDiscussionPopup discussion={disc} commentIndex={idx + 1} onDeleted={() => setDiscussions((prev) => prev.map((d) => d.id === disc.id ? { ...d, discussion: d.discussion.filter((_, i) => i !== idx + 1) } : d))} />, { title: "Tem certeza de que deseja apagar esta mensagem?", closeAriaLabel: "Fechar", dimensions: "m" })}>{" "}</Button>
                                    </div>
                                  </div>
                                  <p className="text-neutral-900 text-sm mt-4">{msg.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {replyingTo === disc.id ? (
                            <div className="mt-48 border-t border-neutral-200 pt-32">
                              <div className="flex justify-between items-center mb-24">
                                <h4 className="font-bold text-neutral-900 text-sm uppercase">Responder</h4>
                                <Button variant="primary" appearance="outline" hasIcon leadingIcon="agora-line-x" leadingIconHover="agora-solid-x" onClick={() => { setReplyingTo(null); setReplyMessage(''); }}>Fechar</Button>
                              </div>
                              {user?.organizations && user.organizations.length > 0 && (
                                <div className="mb-16">
                                  <span className="block text-sm font-medium text-neutral-900 mb-8">Escolha a identidade com a qual deseja publicar esta mensagem.</span>
                                  <IsolatedSelect label="" hideLabel placeholder="Para pesquisar..." id={`reply-identity-${disc.id}`} onChangeRef={replyIdentityRef} searchable searchInputPlaceholder="Para pesquisar..." searchNoResultsText="Sem resultados">
                                    <DropdownSection name="identity">
                                      <DropdownOption value="user">{user.first_name} {user.last_name} (utilizador)</DropdownOption>
                                      {user.organizations.map((org) => (<DropdownOption key={org.id} value={org.id}>{org.name}</DropdownOption>))}
                                    </DropdownSection>
                                  </IsolatedSelect>
                                </div>
                              )}
                              <div className="mb-16">
                                <InputTextArea label="Sua mensagem" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows={3} placeholder="Por favor, mantenha a cordialidade e a postura construtiva. Evite compartilhar informações pessoais." />
                              </div>
                              <div className="flex justify-end gap-16">
                                <Button variant="primary" appearance="outline" disabled={isReplying || !replyMessage.trim()} onClick={async () => { setIsReplying(true); const org = replyIdentityRef.current && replyIdentityRef.current !== 'user' ? replyIdentityRef.current : undefined; const updated = await replyToDiscussion(disc.id, replyMessage.trim(), { organization: org, close: true }); if (updated) { setDiscussions((prev) => prev.map((d) => (d.id === updated.id ? updated : d))); setReplyingTo(null); setReplyMessage(''); } setIsReplying(false); }}>Responder e fechar</Button>
                                <Button variant="primary" appearance="solid" disabled={isReplying || !replyMessage.trim()} onClick={async () => { setIsReplying(true); const org = replyIdentityRef.current && replyIdentityRef.current !== 'user' ? replyIdentityRef.current : undefined; const updated = await replyToDiscussion(disc.id, replyMessage.trim(), { organization: org }); if (updated) { setDiscussions((prev) => prev.map((d) => (d.id === updated.id ? updated : d))); setReplyingTo(null); setReplyMessage(''); } setIsReplying(false); }}>Responder</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end" style={{ marginTop: "32px" }}>
                              <Button variant="primary" appearance="outline" onClick={() => { setReplyingTo(disc.id); setReplyMessage(''); }}>Responder</Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Tab>
          </Tabs>
        </div>
      </section>

      {/* Associated Datasets */}
      {datasetRefs.length > 0 && (
        <section className="bg-white py-64">
          <div className="container mx-auto md:gap-32 xl:gap-64 bg-white">
            <h2 className="text-xl font-bold text-[#000032] mb-32">
              {datasetRefs.length} conjunto{datasetRefs.length !== 1 ? 's' : ''} de dados
              associado{datasetRefs.length !== 1 ? 's' : ''}
            </h2>
            {!isLoadingDatasets && fullDatasets.length > 0 ? (
              <>
                <div
                  className="gap-32"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  }}
                >
                  {paginatedDatasets.map((dataset) => {
                    const qualityScore =
                      dataset.quality?.score != null
                        ? Math.round(dataset.quality.score * 100)
                        : 0;
                    const formatMetric = (value: number | undefined) => {
                      if (!value) return "0";
                      if (value >= 1_000_000)
                        return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
                      if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
                      return String(value);
                    };
                    const timeAgo = dataset.last_modified
                      ? formatDistanceToNow(new Date(dataset.last_modified), { locale: pt })
                        .replace("aproximadamente ", "")
                        .replace("quase ", "")
                        .replace("menos de ", "")
                        .replace("cerca de ", "")
                      : "Desconhecido";

                    return (
                      <Link
                        key={dataset.id}
                        href={`/pages/datasets/${dataset.slug}`}
                        className="card-general-listing rounded-[4px] overflow-hidden h-full flex flex-col"
                      >
                        <CardGeneral
                          variant="white"
                          image={{
                            src:
                              dataset.organization?.logo ||
                              "/images/placeholders/organization.png",
                            alt: dataset.organization?.name || "Organização",
                            height: "56px",
                            className: "bg-primary-100 !object-contain !h-[56px]",
                          }}
                          subtitleText={
                            (
                              <div className="flex flex-col">
                                <span style={{ fontSize: "16px" }} className="text-neutral-900">
                                  {timeAgo}
                                </span>
                                <span
                                  style={{ fontSize: "16px", fontWeight: 300 }}
                                  className="text-neutral-900 mt-4"
                                >
                                  {dataset.organization?.name || "Sem Organização"}
                                </span>
                              </div>
                            ) as unknown as string
                          }
                          titleText={dataset.title}
                          descriptionText={
                            (
                              <div className="flex flex-col grow">
                                <p className="text-m-regular text-neutral-800 line-clamp-3 mb-16">
                                  {dataset.description}
                                </p>
                                <div
                                  className={`mt-auto ${qualityScore <= 45 ? "quality-progress-warning" : qualityScore > 50 ? "quality-progress-success" : ""}`}
                                >
                                  <ProgressBar
                                    value={qualityScore}
                                    max={100}
                                    hideLabel={true}
                                    hidePercentageValue={true}
                                  />
                                  <span className="text-[14px] text-neutral-900 mt-4 block">
                                    {qualityScore}% Qualidade dos metadados
                                  </span>
                                  <div className="flex items-center flex-wrap gap-8 text-xs mt-12 text-neutral-700">
                                    <div className="flex items-center gap-8" title="Visualizações">
                                      <Icon
                                        name="agora-solid-eye"
                                        dimensions="xs"
                                        className="fill-neutral-700"
                                        aria-hidden="true"
                                      />
                                      <span>{formatMetric(dataset.metrics?.views)}</span>
                                    </div>
                                    <div className="flex items-center gap-8" title="Downloads">
                                      <Icon
                                        name="agora-solid-download"
                                        dimensions="xs"
                                        className="fill-neutral-700"
                                        aria-hidden="true"
                                      />
                                      <span>{formatMetric(dataset.metrics?.resources_downloads)}</span>
                                    </div>
                                    <div className="flex items-center gap-8" title="Reutilizações">
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        className="w-16 h-16 fill-neutral-700"
                                        aria-hidden="true"
                                      >
                                        <path d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z" />
                                      </svg>
                                      <span>{dataset.metrics?.reuses || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-8" title="Favoritos">
                                      <Icon
                                        name="agora-solid-star"
                                        dimensions="xs"
                                        className="fill-neutral-700"
                                        aria-hidden="true"
                                      />
                                      <span>{formatMetric(dataset.metrics?.followers)}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-8 text-primary-600 mt-16">
                                    <Icon
                                      name="agora-line-arrow-right-circle"
                                      className="w-32 h-32"
                                      aria-hidden="true"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) as unknown as string
                          }
                          isBlockedLink={true}
                          anchor={{
                            href: `/pages/datasets/${dataset.slug}`,
                          }}
                        />
                      </Link>
                    );
                  })}
                </div>
                {renderDatasetsPagination()}
              </>
            ) : (
              <div className="text-neutral-900">
                Não foi possível carregar os conjuntos de dados associados.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
