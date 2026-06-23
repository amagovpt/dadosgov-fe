"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  Button,
  Icon,
  Pill,
  Tabs,
  Tab,
  TabHeader,
  CardArticle,
  StatusCard,
} from "@ama-pt/agora-design-system";
import { TabBodyWrapper } from "@/components/Shared/Wrappers/TabBodyWrapper";
import { TabPagination } from "@/components/Shared/TabPagination";
import { ExpandableMarkdownDescription } from "@/components/Shared/ExpandableMarkdownDescription";
import { Dataset } from "@/service/types/dataset";
import { Reuse } from "@/service/types/reuse";
import { fetchDataset } from "@/service/api/datasets";
import { followEntity, unfollowEntity, isFollowing } from "@/service/api/followers";
import { fetchReuse } from "@/service/api/reuses";
import { useAuth } from "@/context/AuthContext";
import { DiscussionSection } from "@/components/discussions/DiscussionSection";
import { TagsCollapse } from "@/components/Shared/TagsCollapse";
import { localizeReuseTypeId } from "@/lib/reuse-labels";
import { normalizeRemoteDatasets } from "@/lib/reuse-remote-datasets";
import TextLink from "@/components/Primitives/TextLink";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { formatMetricValue } from "@/utils/formatNumber";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import CardMetrics, { CardMetricsProps } from "../Primitives/Cards/CardMetrics";

interface ReuseDetailClientProps {
  slug: string;
}

export default function ReuseDetailClient({ slug }: ReuseDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { user, isAdmin } = useAuth();
  const [reuse, setReuse] = useState<Reuse | null>(null);

  const canEdit = Boolean(
    user &&
    (isAdmin ||
      (reuse?.owner && reuse.owner.id === user.id) ||
      (reuse?.organization && user.organizations?.some((org) => org.id === reuse.organization?.id)))
  );

  const [isLoadingReuse, setIsLoadingReuse] = useState(true);
  const [fullDatasets, setFullDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const descMeasureRef = useRef<HTMLDivElement>(null);
  const descTitleRef = useRef<HTMLDivElement>(null);
  const descSidebarRef = useRef<HTMLDivElement>(null);

  const reuseTags = reuse?.tags ?? [];


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
      router.push("/login");
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
  // LEDG-1748: external dataset URLs persisted as `extras.remote_datasets`.
  // Until now this list was written from the admin form but never rendered
  // anywhere, so admins had no way to verify what was saved and the public
  // page silently hid the data.
  const remoteDatasets = normalizeRemoteDatasets(reuse?.extras);

  useEffect(() => {
    if (!reuse || datasetRefs.length === 0) {
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

  const paginatedDatasets = fullDatasets.slice(
    (datasetsPage - 1) * datasetsPageSize,
    datasetsPage * datasetsPageSize
  );

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
                  { label: "Início", url: "/" },
                  { label: "Reutilizações", url: "/reuses" },
                  {
                    label: reuse.title,
                    url: `/reuses/${reuse.slug || reuse.id}`,
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
                  <Link href={`/admin/me/reuses/edit?id=${reuse.id}`}>
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
              <TextLink href={`/users/${reuse.owner.slug}`}>
                {reuse.owner.first_name} {reuse.owner.last_name}
              </TextLink>
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
                      <TextLink
                        href={`/organizations/${reuse.organization.slug}`}
                        className="text-sm font-medium hover:text-primary-800"
                      >
                        {reuse.organization.name}
                      </TextLink>
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
            <TabBodyWrapper bleedClassName="bg-neutral-50">
              <div className="mt-6 grid gap-32 xl:grid-cols-12">
                {/* Main Content */}
                <div className="max-w-ch xl:col-span-8">
                  <div className="prose prose-lg relative max-w-none leading-relaxed text-neutral-700">
                    <div ref={descTitleRef}>
                      <h2 className="mb-32 text-base font-medium uppercase text-neutral-900">
                        Descrição
                      </h2>
                    </div>
                    <ExpandableMarkdownDescription
                      variant="sidebarAlign"
                      markdown={reuse.description}
                      asideRef={descSidebarRef}
                      titleRef={descTitleRef}
                      measureRef={descMeasureRef}
                      readMoreReservePx={48}
                      remeasureDeps={[reuse.slug, reuse.description]}
                    />
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
            </TabBodyWrapper>
          </Tab>
          <Tab active={tabParam === "discussions" || undefined}>
            <TabHeader>Discussões</TabHeader>
            <TabBodyWrapper bleedClassName="bg-neutral-50">
              <div>
                <div className="mb-24">
                  <StatusCard
                    variant="informative"
                    showIcon
                    description={
                      <span>
                        A sua questão não é sobre a reutilização?{" "}
                        <TextLink href="/">Visite o nosso fórum.</TextLink>
                      </span>
                    }
                  />
                </div>
                <DiscussionSection entityId={reuse.id} entityClass="Reuse" />
              </div>
            </TabBodyWrapper>
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
                      link: `/datasets/${dataset.slug}`,
                    } as CardMetricsProps;
                    return <CardMetrics key={`dataset-${index}`} {...cardProps} />;
                  })}
                </div>
                <TabPagination
                  total={fullDatasets.length}
                  pageSize={datasetsPageSize}
                  onChange={setDatasetsPage}
                />
              </>
            ) : (
              <div className="text-neutral-900">
                Não foi possível carregar os conjuntos de dados associados.
              </div>
            )}
          </div>
        </section>
      )}

      {/* LEDG-1748: external dataset URLs (extras.remote_datasets) — */}
      {/* rendered as plain link cards. Title/description per entry will */}
      {/* land in PR 2; for now we show the URL as both label and target. */}
      {remoteDatasets.length > 0 && (
        <section className="w-full py-64">
          <div className="container mx-auto bg-white md:gap-32 xl:gap-64">
            <h2 className="text-xl mb-32 font-bold text-[#000032]">
              {remoteDatasets.length} conjunto{remoteDatasets.length !== 1 ? "s" : ""} de dados
              externo{remoteDatasets.length !== 1 ? "s" : ""}
            </h2>
            <ul className="flex flex-col gap-16">
              {remoteDatasets.map((entry, index) => (
                <li
                  key={`remote-dataset-${index}`}
                  className="rounded-8 border border-neutral-200 p-16"
                >
                  <TextLink href={entry.url} className="break-all font-medium">
                    {entry.title || entry.url}
                  </TextLink>
                  {entry.description && (
                    <p className="text-sm mt-8 text-neutral-700">{entry.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
