"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Icon,
  Breadcrumb,
  Pill,
  ProgressBar,
  CardExpandable,
} from "@ama-pt/agora-design-system";
import { Dataset } from "@/service/types/dataset";
import { fetchDataset } from "@/service/api/datasets";
import { followEntity, isFollowing, unfollowEntity } from "@/service/api/followers";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { DatasetTabs } from "@/components/datasets/DatasetTabs";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import { formatMetricValue } from "@/utils/formatNumber";
import TextLink from "@/components/Primitives/TextLink";
import { DescriptionWithReadMore } from "@/components/Shared/DescriptionWithReadMore";

interface DatasetDetailClientProps {
  slug: string;
}

const QUALITY_CRITERIA: [keyof NonNullable<Dataset["quality"]>, string][] = [
  ["dataset_description_quality", "Descrição"],
  ["has_resources", "Recursos"],
  ["license", "Licença"],
  ["update_frequency", "Frequência"],
  ["temporal_coverage", "Cobertura temporal"],
  ["spatial", "Cobertura espacial"],
  ["has_open_format", "Formato aberto"],
  ["resources_documentation", "Documentação"],
  ["all_resources_available", "Recursos disponíveis"],
];

function getQualityDetails(quality?: Dataset["quality"]): string[] {
  if (!quality) return [];
  return QUALITY_CRITERIA.filter(([key]) => quality[key] === true).map(([, label]) => label);
}

function getQualityMissing(quality?: Dataset["quality"]): string[] {
  if (!quality) return QUALITY_CRITERIA.map(([, label]) => label);
  return QUALITY_CRITERIA.filter(([key]) => quality[key] !== true).map(([, label]) => label);
}

const CONTACT_ROLE_LABELS: Record<string, string> = {
  contact: "Contacto",
  creator: "Criador",
  publisher: "Publicador",
  rightsHolder: "Titular de Direitos",
  custodian: "Custódio",
  distributor: "Distribuidor",
  originator: "Originador",
  principalInvestigator: "Investigador Principal",
  processor: "Processador",
  resourceProvider: "Fornecedor de Recurso",
  user: "Utilizador",
};

export default function DatasetDetailClient({ slug }: DatasetDetailClientProps) {
  const { user, isAdmin } = useAuth();
  const { organizations } = useActiveOrganization();
  const router = useRouter();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [qualityExpanded, setQualityExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadDataset() {
      try {
        const data = await fetchDataset(slug);
        if (!cancelled) setDataset(data);
      } catch (error) {
        console.error("Error loading dataset:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadDataset();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!user || !dataset) return;
    let cancelled = false;
    isFollowing("datasets", dataset.id, user.id)
      .then((following) => { if (!cancelled) setIsFavorite(following); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, dataset?.id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/pages/login");
      return;
    }
    if (!dataset || isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        await unfollowEntity("datasets", dataset.id);
        setIsFavorite(false);
      } else {
        await followEntity("datasets", dataset.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!dataset) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-500">Conjunto de dados não encontrado.</p>
      </div>
    );
  }

  const ownerFullName = dataset.owner
    ? `${dataset.owner.first_name} ${dataset.owner.last_name}`.trim()
    : null;

  const qualityScore = calculateQualityScore(QUALITY_CRITERIA, dataset.quality);
  const qualityDetails = getQualityDetails(dataset.quality);
  const qualityMissing = getQualityMissing(dataset.quality);

  return (
    <main className="flex w-full flex-col items-center justify-center gap-64">
      {/* Breadcrumb */}
      <div className="container flex items-center justify-between py-64">
        <Breadcrumb
          items={[
            { label: "Home", url: "/" },
            { label: "Conjuntos de dados", url: "/pages/datasets" },
            { label: dataset.title, url: `/pages/datasets/${dataset.slug}` },
          ]}
        />
      </div>

      {/* Actions */}
      <div className="container flex items-center justify-end gap-16">
        {dataset.private && <Pill variant="warning">Rascunho</Pill>}
        {dataset.archived && <Pill variant="neutral">Arquivado</Pill>}
        <Button
          variant="neutral"
          appearance="link"
          hasIcon={true}
          leadingIcon={isFavorite ? "agora-solid-star" : "agora-line-star"}
          leadingIconHover="agora-solid-star"
          className="flex-shrink-0"
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
        >
          {isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        </Button>
        {(isAdmin ||
          (user && dataset.owner?.id === user.id) ||
          (dataset.organization &&
            organizations.some((org) => org.id === dataset.organization?.id))) && (
          <Link href={`/pages/admin/me/datasets/edit?id=${dataset.id}`}>
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

      <div className="container grid gap-32 xl:grid-cols-12">
        {/* Main Content Column */}
        <div className="xl:col-span-6 xl:block">
          <div className="flex flex-col gap-4" ref={titleRef}>
            <h1 className="mb-24 text-xl-bold leading-tight text-primary-900">{dataset.title}</h1>
          </div>

          {/* Description */}
          <DescriptionWithReadMore
            text={dataset.description}
            sidebarRef={sidebarRef}
            titleRef={titleRef}
          />
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-6">
          <div className="flex h-fit flex-col" ref={sidebarRef}>
            <div className="mb-16 flex flex-col gap-16 rounded-4 bg-[#F2F6FF] p-32">
              {dataset.organization?.logo ? (
                <div className="card-article-3_2-img flex h-48 w-fit items-center justify-center rounded-8 border-2 border-primary-300 py-8">
                  <img
                    src={dataset.organization.logo}
                    alt={dataset.organization.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : dataset.owner?.avatar_thumbnail ? (
                <div className="card-article-3_2-img flex h-48 w-fit items-center justify-center rounded-8 border-2 border-primary-300 py-8">
                  <img
                    src={dataset.owner.avatar_thumbnail}
                    alt={ownerFullName ?? "Autor"}
                    className="max-h-full max-w-full rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex w-fit items-center justify-center rounded-8 border border-neutral-200 bg-neutral-100 px-12 py-12 text-neutral-400">
                  <Icon
                    name={dataset.owner ? "agora-line-user" : "agora-line-buildings"}
                    className="h-6 w-6"
                  />
                </div>
              )}

              <div className="space-y-16">
                <div className="mb-8 text-m-light text-neutral-900">
                  {dataset.organization ? (
                    <Link
                      href={`/pages/organizations/${dataset.organization.slug}`}
                      className="hover:underline"
                    >
                      {dataset.organization.name}
                    </Link>
                  ) : dataset.owner ? (
                    /* LEDG-1861: user-authored datasets link to the public
                       profile instead of the broken "Organização Desconhecida"
                       fallback. */
                    <Link
                      href={`/pages/users/${dataset.owner.slug}`}
                      className="hover:underline"
                    >
                      {ownerFullName}
                    </Link>
                  ) : (
                    "Sem autor"
                  )}
                </div>
                <div className="text-sm mb-16 text-neutral-900">
                  <span className="text-m-semibold">Última atualização:</span>{" "}
                  {new Date(dataset.last_modified).toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                {dataset.license && (
                  <div className="text-sm">
                    <TextLink
                      href={
                        dataset.license_url ||
                        `/pages/licenses/${dataset.license}/`
                      }
                    >
                      <span className="text-m-semibold">Licença:</span>{" "}
                      {dataset.license_title || dataset.license}
                    </TextLink>
                  </div>
                )}
                {dataset.contact_points && dataset.contact_points.length > 0 && (
                  <div className="flex flex-col gap-12 border-t border-neutral-200 pt-16">
                    {dataset.contact_points.map((cp) => (
                      <div key={cp.id} className="text-sm">
                        <div className="mb-4 text-m-semibold">
                          {CONTACT_ROLE_LABELS[cp.role] ?? cp.role}
                        </div>
                        <div className="mb-4 text-neutral-900">{cp.name}</div>
                        {cp.email && (
                          <TextLink href={`mailto:${cp.email}`} className="block break-all">
                            {cp.email}
                          </TextLink>
                        )}
                        {cp.contact_form && (
                          <TextLink href={cp.contact_form} className="block">
                            Formulário de contacto
                          </TextLink>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="mb-16 grid grid-cols-2 gap-16">
              <div className="rounded-4 bg-[#F2F6FF] p-32">
                <div className="text-sm mb-8">Visualizações</div>
                <div className="mb-8 text-l-semibold font-bold text-neutral-900">
                  {formatMetricValue(dataset.metrics?.views)}
                </div>
              </div>
              <div className="rounded-4 bg-[#F2F6FF] p-32">
                <div className="text-sm mb-8">Downloads</div>
                <div className="mb-8 text-l-semibold font-bold text-neutral-900">
                  {formatMetricValue(dataset.metrics?.resources_downloads)}
                </div>
              </div>
            </div>

            {/* Quality */}
            <CardExpandable
              variant="primary-100"
              cardTitle="Qualidade dos metadados"
              cardHeadingLevel="h3"
              cardSubtitle={
                <div className="mt-8 flex flex-col gap-4">
                  <div
                    className={
                      qualityScore <= 45
                        ? "quality-progress-warning"
                        : qualityScore > 50
                          ? "quality-progress-success"
                          : ""
                    }
                  >
                    <ProgressBar value={qualityScore} max={100} hidePercentageValue={true} />
                  </div>
                  <div className="text-xs text-neutral-700">
                    {qualityScore}%{qualityDetails.length > 0 && ` (${qualityDetails.join(", ")})`}
                  </div>
                </div>
              }
              accordionHeadingTitle={qualityExpanded ? "Fechar informação" : "Ver mais informação"}
              accordionHeadingLevel="h4"
              expanded={qualityExpanded}
              onExpanded={() => setQualityExpanded(true)}
              onCollapsed={() => setQualityExpanded(false)}
            >
              {qualityMissing.length > 0 && (
                <div className="flex flex-col gap-8">
                  {qualityMissing.map((label) => (
                    <div key={label} className="flex items-center gap-8">
                      <Icon
                        name="agora-line-alert-triangle"
                        className="h-20 w-20 fill-[#B06112]"
                      />
                      <span className="text-base text-neutral-900">
                        {label} dos dados não preenchidos
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardExpandable>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <DatasetTabs dataset={dataset} />
    </main>
  );
}
