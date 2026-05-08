"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "@ama-pt/agora-design-system";
import { Reuse, Dataset, Discussion, DiscussionCreatePayload } from "@/types/api";
import {
  fetchDataset,
  fetchReuse,
  fetchDiscussions,
  createDiscussion,
  replyToDiscussion,
  followEntity,
  unfollowEntity,
  isFollowing,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import EditDiscussionPopup from "@/components/discussions/EditDiscussionPopup";
import DeleteDiscussionPopup from "@/components/discussions/DeleteDiscussionPopup";
import { TagsCollapse } from "@/components/Shared/TagsCollapse";
import { localizeReuseTypeId } from "@/lib/reuse-labels";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { formatMetricValue } from "@/utils/formatNumber";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import CardMetrics, { CardMetricsProps } from "../Primitives/Cards/CardMetrics";

interface ReuseDetailClientProps {
  slug: string;
}

export default function ReuseDetailClient({ slug }: ReuseDetailClientProps) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [reuse, setReuse] = useState<Reuse | null>(null);

  const canEdit = Boolean(
    user &&
    (isAdmin ||
      (reuse?.owner && reuse.owner.id === user.id) ||
      (reuse?.organization && user.organizations?.some((org) => org.id === reuse.organization?.id)))
  );

  const { show, hide } = usePopupContext();
  const [isLoadingReuse, setIsLoadingReuse] = useState(true);
  const [fullDatasets, setFullDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionCount, setDiscussionCount] = useState(0);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState("");
  const [newDiscMessage, setNewDiscMessage] = useState("");
  const selectedIdentityRef = useRef("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const replyIdentityRef = useRef("");
  const [isReplying, setIsReplying] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

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

  const reuseTags = reuse?.tags ?? [];

  const handleCreateDiscussion = async () => {
    if (!reuse || !newDiscTitle.trim() || !newDiscMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const payload: DiscussionCreatePayload = {
        title: newDiscTitle.trim(),
        comment: newDiscMessage.trim(),
        subject: {
          class: "Reuse",
          id: reuse.id,
        },
        ...(selectedIdentityRef.current && selectedIdentityRef.current !== "user"
          ? { organization: selectedIdentityRef.current }
          : {}),
      };
      const created = await createDiscussion(payload);
      if (created) {
        setDiscussions((prev) => [created, ...prev]);
        setDiscussionCount((prev) => prev + 1);
        setNewDiscTitle("");
        setNewDiscMessage("");
        setShowNewDiscussion(false);
      }
    } catch (error) {
      console.error("Error creating discussion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function loadReuse() {
      try {
        const data = await fetchReuse(slug);
        setReuse(data);
        if (user && data) {
          const following = await isFollowing("reuses", data.id, user.id);
          setIsFavorite(following);
        }
      } catch (error) {
        console.error("Error loading reuse:", error);
      } finally {
        setIsLoadingReuse(false);
      }
    }
    loadReuse();
  }, [slug, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/pages/login");
      return;
    }
    if (!reuse || isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        await unfollowEntity("reuses", reuse.id);
        setIsFavorite(false);
      } else {
        await followEntity("reuses", reuse.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };
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
        const slugs = datasetRefs.map((d) => d.uri.split("/").filter(Boolean).pop() || d.id);
        const results = await Promise.all(slugs.map((s) => fetchDataset(s).catch(() => null)));
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
    return <p className="p-32 text-base text-neutral-900">A carregar...</p>;
  }

  if (!reuse) {
    return <p className="p-32 text-base text-neutral-900">Reutilização não encontrada.</p>;
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
          className="absolute inset-y-0 z-0 -mx-4 bg-neutral-50 sm:-mx-8 md:-mx-16 lg:-mx-32 xl:-mx-64"
          aria-hidden="true"
        />
        <div className="relative z-10">
          <div className="container mx-auto">{content}</div>
        </div>
      </div>
    </TabBody>
  );

  const renderSetDropdown =
    user && user.organizations
      ? [
          { value: "user", label: `${user.first_name} ${user.last_name} (utilizador)` },
          ...user.organizations.map((org) => ({ value: org.id, label: org.name })),
        ]
      : [];

  return (
    <div className="flex w-full flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="container bg-white text-neutral-900">
        <div className="w-full">
          {/* Breadcrumbs & Actions */}
          <div className="mb-24">
            <div className="mb-24">
              <Breadcrumb
                darkMode={false}
                items={[
                  { label: "Home", url: "/" },
                  { label: "Reutilizações", url: "/pages/reuses" },
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
                  appearance={isFavorite ? "solid" : "outline"}
                  darkMode={false}
                  hasIcon={true}
                  leadingIcon={isFavorite ? "agora-solid-star" : "agora-line-star"}
                  leadingIconHover="agora-solid-star"
                  onClick={handleToggleFavorite}
                  disabled={isTogglingFavorite}
                >
                  {isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                </Button>
                <Button
                  variant="primary"
                  hasIcon={true}
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-line-external-link"
                  onClick={() => window.open(reuse.url, "_blank")}
                >
                  Veja reutilização
                </Button>
                {canEdit && (
                  <Link href={`/pages/admin/me/reuses/edit?id=${reuse.id}`}>
                    <Button
                      variant="primary"
                      hasIcon={true}
                      leadingIcon="agora-line-edit"
                      leadingIconHover="agora-solid-edit"
                    >
                      Editar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Draft indicator (visible to the producer / org members) */}
          {reuse.private && (
            <div className="mt-16">
              <Pill variant="warning" appearance="solid">
                RASCUNHO
              </Pill>
            </div>
          )}

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
          <div className="mb-24 mt-6 grid gap-32 xl:grid-cols-12">
            {/* Image Column */}
            <div className="xl:col-span-8">
              <div className="w-full">
                <img
                  src={reuse.image || "/laptop.png"}
                  alt={reuse.title}
                  className="w-full rounded-4"
                  style={{ height: "308px", objectFit: "contain" }}
                />
              </div>
            </div>

            {/* Card Column */}
            <div className="card-article-3_2 xl:col-span-4">
              <CardArticle
                className="bg-[#F2F6FF]! border-none shadow-none [&_.container-body]:flex [&_.container-body]:flex-col [&_.container-body]:p-32"
                title={reuse.title}
                subtitle={
                  <div className="mb-16 flex flex-col gap-24">
                    {reuse.organization?.logo ? (
                      <div className="card-article-3_2-img flex h-48 w-fit items-center justify-center rounded-8 border-2 border-primary-300 py-8">
                        <img src={reuse.organization.logo} alt={reuse.organization.name} />
                      </div>
                    ) : (
                      <div className="text-xs shadow-sm flex h-56 w-[160px] items-center justify-center rounded-8 border border-dashed border-neutral-300 bg-white font-bold uppercase tracking-wider text-neutral-400">
                        {reuse.organization?.name || "Sem organização"}
                      </div>
                    )}
                    {reuse.organization && (
                      <Link
                        href={`/pages/organizations/${reuse.organization.slug}`}
                        className="text-sm font-medium text-primary-600 underline hover:text-primary-800"
                      >
                        {reuse.organization.name}
                      </Link>
                    )}
                  </div>
                }
              >
                <div className="flex h-full flex-col gap-24">
                  <div className="flex flex-wrap items-center gap-16 text-[15px]">
                    <span className="font-semibold text-neutral-900">
                      {localizeReuseTypeId(reuse.type) || "Aplicação"}
                    </span>
                    <div className="flex items-center gap-8">
                      <Icon
                        name="agora-line-eye"
                        className="h-20 w-20 fill-[var(--color-neutral-900)]"
                      />
                      <span className="text-neutral-900">
                        {formatMetricValue(reuse.metrics?.views, 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-8">
                      <Icon
                        name="agora-line-layers-menu"
                        className="h-20 w-20 fill-[var(--color-neutral-900)]"
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
      <section className="w-full">
        <Tabs>
          <Tab>
            <TabHeader>Descrição</TabHeader>
            {renderTabBody(
              <div className="mt-6 grid gap-32 xl:grid-cols-12">
                {/* Main Content */}
                <div className="max-w-ch xl:col-span-8">
                  <div className="prose prose-lg relative max-w-none leading-relaxed text-neutral-700">
                    <div ref={descTitleRef}>
                      <h2 className="mb-32 text-base font-medium uppercase text-neutral-900">
                        Descrição
                      </h2>
                    </div>
                    {/* Hidden measure element */}
                    <div
                      ref={descMeasureRef}
                      className="pointer-events-none invisible absolute"
                      style={{ top: 0, left: 0, right: 0 }}
                      aria-hidden="true"
                    >
                      <div className="mb-32 text-neutral-900 [&_a]:text-primary-600 [&_a]:underline">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                        >
                          {reuse.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div
                      className="overflow-hidden"
                      style={
                        !descExpanded && descOverflowing && descAvailableHeight
                          ? { maxHeight: descAvailableHeight }
                          : undefined
                      }
                    >
                      <div className="mb-32 text-neutral-900 [&_a]:text-primary-600 [&_a]:underline">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                        >
                          {reuse.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                    {descOverflowing && (
                      <button
                        onClick={() => setDescExpanded(!descExpanded)}
                        className="mt-8 flex cursor-pointer items-center gap-8 text-primary-600 hover:underline"
                      >
                        {descExpanded ? "Ler menos" : "Ler mais"}
                        {descExpanded ? (
                          <Icon name="agora-line-arrow-up-circle" className="h-24 w-24" />
                        ) : (
                          <Icon name="agora-line-arrow-down-circle" className="h-24 w-24" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sidebar Metadata */}
                <aside
                  className="flex min-w-0 flex-col gap-16 md:pt-64 xl:col-span-4"
                  ref={descSidebarRef}
                >
                  {reuseTags.length > 0 && (
                    <div className="min-w-0 rounded-4 bg-white p-32">
                      <TagsCollapse
                        tags={reuseTags}
                        title="Etiquetas"
                        titleClassName="text-sm font-bold tracking-wider mb-8"
                      />
                    </div>
                  )}

                  <div className="rounded-4 bg-white p-32">
                    <h3 className="text-sm mb-8 font-bold tracking-wider">Última atualização</h3>
                    <p className="font-medium text-neutral-900">
                      {formatDate(reuse.last_modified)}
                    </p>
                  </div>

                  <div className="rounded-4 bg-white p-32">
                    <h3 className="text-sm mb-8 font-bold tracking-wider">Data de criação</h3>
                    <p className="font-medium text-neutral-900">{formatDate(reuse.created_at)}</p>
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
                    variant="informative"
                    showIcon
                    description={
                      <span>
                        A sua questão não é sobre a reutilização?{" "}
                        <Link
                          href="https://dados.gov.pt/pt/"
                          className="text-primary-600 underline"
                          target="_blank"
                        >
                          Visite o nosso fórum.
                        </Link>
                      </span>
                    }
                  />
                </div>
                <div className="mb-24 flex items-center justify-between">
                  <h3 className="text-base font-medium text-neutral-900">
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
                      className="self-stretch"
                      onClick={() => setShowNewDiscussion(!showNewDiscussion)}
                    >
                      Nova discussão
                    </Button>
                  </div>
                </div>
                {showNewDiscussion && (
                  <div className="mb-24 rounded-8 bg-white p-32">
                    <div className="mb-16 flex items-center justify-between">
                      <h3 className="text-base font-bold text-neutral-900">Nova discussão</h3>
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
                    <p className="text-sm mb-16 text-neutral-900">
                      Os campos marcados com um asterisco (<span className="text-red-500">*</span>)
                      são obrigatórios.
                    </p>
                    {user?.organizations && user.organizations.length > 0 && (
                      <div className="mb-24">
                        <span className="text-sm mb-8 block font-medium text-neutral-900">
                          Escolha a identidade com a qual deseja publicar esta mensagem.
                        </span>
                        <IsolatedSelect
                          label=""
                          hideLabel
                          placeholder="Para pesquisar..."
                          id="discussion-identity-reuse"
                          onChangeRef={selectedIdentityRef}
                          searchable
                          searchInputPlaceholder="Para pesquisar..."
                          searchNoResultsText="Sem resultados"
                        >
                          <DropdownSection name="identity">
                            {renderSetDropdown.map((option) => (
                              <DropdownOption key={option.value} value={option.value}>
                                {option.label}
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
                        label="Mensagem *"
                        value={newDiscMessage}
                        onChange={(e) => setNewDiscMessage(e.target.value)}
                        rows={4}
                        placeholder="Mantenha a cordialidade e postura construtiva. Não partilhe informações pessoais."
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
                        {isSubmitting ? "A enviar..." : "Enviar"}
                      </Button>
                    </div>
                  </div>
                )}
                {discussionCount === 0 ? (
                  <CardNoResults
                    position="center"
                    icon={
                      <Icon
                        name="agora-line-chat"
                        className="icon-xl h-40 w-40 text-primary-500"
                      />
                    }
                    title="Ainda não há discussão."
                    description=""
                    hasAnchor={false}
                  />
                ) : (
                  <div className="flex flex-col gap-32">
                    {discussions.map((disc) => (
                      <div key={disc.id} className="rounded-8 bg-white p-32">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-base font-bold text-neutral-900">{disc.title}</h4>
                            <p className="text-sm mt-4 text-neutral-900">
                              <span className="font-medium text-primary-600">
                                {disc.user.first_name} {disc.user.last_name}
                              </span>
                              {" — Publicado em "}
                              {format(new Date(disc.created), "d 'de' MMMM 'de' yyyy", {
                                locale: pt,
                              })}
                            </p>
                          </div>
                          <div className="flex gap-8">
                            <Button
                              variant="primary"
                              appearance="outline"
                              hasIcon
                              iconOnly
                              leadingIcon="agora-line-edit"
                              leadingIconHover="agora-solid-edit"
                              aria-label="Editar discussão"
                              onClick={() =>
                                show(
                                  <EditDiscussionPopup
                                    discussion={disc}
                                    commentIndex={0}
                                    onUpdated={(updated) =>
                                      setDiscussions((prev) =>
                                        prev.map((d) => (d.id === updated.id ? updated : d))
                                      )
                                    }
                                  />,
                                  {
                                    title: "Editar a mensagem",
                                    closeAriaLabel: "Fechar",
                                    dimensions: "m",
                                  }
                                )
                              }
                            >
                              {" "}
                            </Button>
                            <Button
                              variant="danger"
                              appearance="solid"
                              hasIcon
                              iconOnly
                              leadingIcon="agora-line-trash"
                              leadingIconHover="agora-solid-trash"
                              aria-label="Eliminar discussão"
                              onClick={() =>
                                show(
                                  <DeleteDiscussionPopup
                                    discussion={disc}
                                    commentIndex={0}
                                    onDeleted={() => {
                                      setDiscussions((prev) =>
                                        prev.filter((d) => d.id !== disc.id)
                                      );
                                      setDiscussionCount((prev) => prev - 1);
                                    }}
                                  />,
                                  {
                                    title: "Tem certeza de que deseja eliminar esta discussão?",
                                    closeAriaLabel: "Fechar",
                                    dimensions: "m",
                                  }
                                )
                              }
                            >
                              {" "}
                            </Button>
                          </div>
                        </div>
                        {disc.discussion.length > 0 && (
                          <p className="text-sm mb-16 mt-16 text-neutral-900">
                            {disc.discussion[0].content}
                          </p>
                        )}
                        {disc.discussion.length > 1 && (
                          <div className="mt-16 space-y-16 border-t border-neutral-200 pt-16">
                            {disc.discussion.slice(1).map((msg, idx) => (
                              <div
                                key={idx}
                                className="border-l-2 border-primary-600"
                                style={{ paddingLeft: "24px" }}
                              >
                                <div className="flex items-start justify-between">
                                  <p className="text-sm text-neutral-900">
                                    <span className="font-medium text-primary-600">
                                      {msg.posted_by.first_name} {msg.posted_by.last_name}
                                    </span>
                                    {" — "}
                                    {format(new Date(msg.posted_on), "d 'de' MMMM 'de' yyyy", {
                                      locale: pt,
                                    })}
                                  </p>
                                  <div className="flex gap-8">
                                    <Button
                                      variant="primary"
                                      appearance="outline"
                                      hasIcon
                                      iconOnly
                                      leadingIcon="agora-line-edit"
                                      leadingIconHover="agora-solid-edit"
                                      aria-label="Editar comentário"
                                      onClick={() =>
                                        show(
                                          <EditDiscussionPopup
                                            discussion={disc}
                                            commentIndex={idx + 1}
                                            onUpdated={(updated) =>
                                              setDiscussions((prev) =>
                                                prev.map((d) => (d.id === updated.id ? updated : d))
                                              )
                                            }
                                          />,
                                          {
                                            title: "Editar a mensagem",
                                            closeAriaLabel: "Fechar",
                                            dimensions: "m",
                                          }
                                        )
                                      }
                                    >
                                      {" "}
                                    </Button>
                                    <Button
                                      variant="danger"
                                      appearance="solid"
                                      hasIcon
                                      iconOnly
                                      leadingIcon="agora-line-trash"
                                      leadingIconHover="agora-solid-trash"
                                      aria-label="Eliminar comentário"
                                      onClick={() =>
                                        show(
                                          <DeleteDiscussionPopup
                                            discussion={disc}
                                            commentIndex={idx + 1}
                                            onDeleted={() =>
                                              setDiscussions((prev) =>
                                                prev.map((d) =>
                                                  d.id === disc.id
                                                    ? {
                                                        ...d,
                                                        discussion: d.discussion.filter(
                                                          (_, i) => i !== idx + 1
                                                        ),
                                                      }
                                                    : d
                                                )
                                              )
                                            }
                                          />,
                                          {
                                            title:
                                              "Tem certeza de que deseja apagar esta mensagem?",
                                            closeAriaLabel: "Fechar",
                                            dimensions: "m",
                                          }
                                        )
                                      }
                                    >
                                      {" "}
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm mt-4 text-neutral-900">{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {replyingTo === disc.id ? (
                          <div className="mt-48 border-t border-neutral-200 pt-32">
                            <div className="mb-24 flex items-center justify-between">
                              <h4 className="text-sm font-bold uppercase text-neutral-900">
                                Responder
                              </h4>
                              <Button
                                variant="primary"
                                appearance="outline"
                                hasIcon
                                leadingIcon="agora-line-x"
                                leadingIconHover="agora-solid-x"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyMessage("");
                                }}
                              >
                                Fechar
                              </Button>
                            </div>
                            {user?.organizations && user.organizations.length > 0 && (
                              <div className="mb-16">
                                <span className="text-sm mb-8 block font-medium text-neutral-900">
                                  Escolha a identidade com a qual deseja publicar esta mensagem.
                                </span>
                                <IsolatedSelect
                                  label=""
                                  hideLabel
                                  placeholder="Para pesquisar..."
                                  id={`reply-identity-${disc.id}`}
                                  onChangeRef={replyIdentityRef}
                                  searchable
                                  searchInputPlaceholder="Para pesquisar..."
                                  searchNoResultsText="Sem resultados"
                                >
                                  <DropdownSection name="identity">
                                    {renderSetDropdown.map((option) => (
                                      <DropdownOption key={option.value} value={option.value}>
                                        {option.label}
                                      </DropdownOption>
                                    ))}
                                  </DropdownSection>
                                </IsolatedSelect>
                              </div>
                            )}
                            <div className="mb-16">
                              <InputTextArea
                                label="Mensagem"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                rows={3}
                                placeholder="Mantenha a cordialidade e postura construtiva. Não partilhe informações pessoais."
                              />
                            </div>
                            <div className="flex justify-end gap-16">
                              <Button
                                variant="primary"
                                appearance="outline"
                                disabled={isReplying || !replyMessage.trim()}
                                onClick={async () => {
                                  setIsReplying(true);
                                  const org =
                                    replyIdentityRef.current && replyIdentityRef.current !== "user"
                                      ? replyIdentityRef.current
                                      : undefined;
                                  const updated = await replyToDiscussion(
                                    disc.id,
                                    replyMessage.trim(),
                                    { organization: org, close: true }
                                  );
                                  if (updated) {
                                    setDiscussions((prev) =>
                                      prev.map((d) => (d.id === updated.id ? updated : d))
                                    );
                                    setReplyingTo(null);
                                    setReplyMessage("");
                                  }
                                  setIsReplying(false);
                                }}
                              >
                                Responder e fechar
                              </Button>
                              <Button
                                variant="primary"
                                appearance="solid"
                                disabled={isReplying || !replyMessage.trim()}
                                onClick={async () => {
                                  setIsReplying(true);
                                  const org =
                                    replyIdentityRef.current && replyIdentityRef.current !== "user"
                                      ? replyIdentityRef.current
                                      : undefined;
                                  const updated = await replyToDiscussion(
                                    disc.id,
                                    replyMessage.trim(),
                                    { organization: org }
                                  );
                                  if (updated) {
                                    setDiscussions((prev) =>
                                      prev.map((d) => (d.id === updated.id ? updated : d))
                                    );
                                    setReplyingTo(null);
                                    setReplyMessage("");
                                  }
                                  setIsReplying(false);
                                }}
                              >
                                Responder
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end" style={{ marginTop: "32px" }}>
                            <Button
                              variant="primary"
                              appearance="outline"
                              onClick={() => {
                                setReplyingTo(disc.id);
                                setReplyMessage("");
                              }}
                            >
                              Responder
                            </Button>
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
      </section>

      {/* Associated Datasets */}
      {datasetRefs.length > 0 && (
        <section className="w-full py-64">
          <div className="container mx-auto bg-white md:gap-32 xl:gap-64">
            <h2 className="text-xl mb-32 font-bold text-[#000032]">
              {datasetRefs.length} conjunto{datasetRefs.length !== 1 ? "s" : ""} de dados associado
              {datasetRefs.length !== 1 ? "s" : ""}
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
                  {paginatedDatasets.map((dataset, index) => {
                    const timeAgo = formatDateToTimeAgo(dataset.last_modified);
                    const cardProps = {
                      ...dataset,
                      last_modified: timeAgo,
                      link: `/pages/datasets/${dataset.slug}`,
                    } as CardMetricsProps;
                    return <CardMetrics key={`dataset-${index}`} {...cardProps} />;
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
