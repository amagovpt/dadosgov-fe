"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { Dataset } from "@/types/api";
import { fetchDataset, followEntity, isFollowing, unfollowEntity } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { DatasetTabs } from "@/components/datasets/DatasetTabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DatasetDetailClientProps {
  slug: string;
}

const READMORE_BUTTON_HEIGHT = 48;

function DescriptionWithReadMore({
  text,
  sidebarRef,
  titleRef,
}: {
  text: string;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  titleRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [availableHeight, setAvailableHeight] = useState<number | undefined>(undefined);
  const measureRef = useRef<HTMLDivElement>(null);

  const checkOverflow = useCallback(() => {
    if (measureRef.current && sidebarRef.current && titleRef.current) {
      const sidebarHeight = sidebarRef.current.offsetHeight;
      const titleHeight = titleRef.current.offsetHeight;
      const fullHeight = measureRef.current.offsetHeight;
      const maxDescHeight = sidebarHeight - titleHeight;
      const overflows = fullHeight > maxDescHeight;
      if (overflows) {
        const lineHeight = parseFloat(getComputedStyle(measureRef.current).lineHeight) || 24;
        const usable = maxDescHeight - READMORE_BUTTON_HEIGHT;
        const snapped = Math.floor(usable / lineHeight) * lineHeight;
        setAvailableHeight(snapped);
      } else {
        setAvailableHeight(maxDescHeight);
      }
      setIsOverflowing(overflows);
    }
  }, [sidebarRef, titleRef]);

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    const observer = new ResizeObserver(checkOverflow);
    if (sidebarRef.current) observer.observe(sidebarRef.current);
    if (measureRef.current) observer.observe(measureRef.current);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      observer.disconnect();
    };
  }, [checkOverflow, text]);

  return (
    <div className="prose max-w-none max-w-ch text-neutral-700 text-lg leading-relaxed mb-12 relative">
      {/* Hidden measure element to get full content height */}
      <div
        ref={measureRef}
        className="absolute invisible pointer-events-none"
        style={{ top: 0, left: 0, right: 0 }}
        aria-hidden="true"
      >
        <div className="text-neutral-900 text-m-light mb-[24px] markdown-container">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
          >
            {text}
          </ReactMarkdown>
        </div>
      </div>
      <div
        className="overflow-hidden"
        style={
          !expanded && isOverflowing && availableHeight ? { maxHeight: availableHeight } : undefined
        }
      >
        <div className="text-neutral-900 text-m-light mb-[24px] markdown-container">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
          >
            {text}
          </ReactMarkdown>
        </div>
      </div>
      {isOverflowing && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-8 text-primary-600 cursor-pointer hover:underline mt-8"
        >
          {expanded ? "Ler menos" : "Ler mais"}
          {expanded ? (
            <Icon name="agora-line-arrow-up-circle" className="w-24 h-24" />
          ) : (
            <Icon name="agora-line-arrow-down-circle" className="w-24 h-24" />
          )}
        </button>
      )}
    </div>
  );
}

function formatMetricValue(value: number | undefined): string {
  if (!value || value === 0) return "0";
  if (value >= 1_000_000) {
    return (value / 1_000_000).toLocaleString("pt-PT", { maximumFractionDigits: 1 }) + " M";
  }
  if (value >= 1_000) {
    return (value / 1_000).toLocaleString("pt-PT", { maximumFractionDigits: 1 }) + " mil";
  }
  return value.toLocaleString("pt-PT");
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

function calculateQualityScore(quality?: Dataset["quality"]): number {
  if (!quality) return 0;
  if (quality.score > 0) return Math.round(quality.score * 100);
  const met = QUALITY_CRITERIA.filter(([key]) => quality[key] === true).length;
  return Math.round((met / QUALITY_CRITERIA.length) * 100);
}

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
    async function loadDataset() {
      try {
        const data = await fetchDataset(slug);
        setDataset(data);
        if (user && data) {
          const following = await isFollowing("datasets", data.id, user.id);
          setIsFavorite(following);
        }
      } catch (error) {
        console.error("Error loading dataset:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDataset();
  }, [slug, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/pages/login");
      return;
    }
    if (!dataset || isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        const success = await unfollowEntity("datasets", dataset.id);
        if (success) setIsFavorite(false);
      } else {
        const result = await followEntity("datasets", dataset.id);
        if (result) setIsFavorite(true);
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
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-neutral-500">Conjunto de dados não encontrado.</p>
      </div>
    );
  }

  const qualityScore = calculateQualityScore(dataset.quality);
  const qualityDetails = getQualityDetails(dataset.quality);
  const qualityMissing = getQualityMissing(dataset.quality);

  return (
    <div className="flex flex-col font-sans text-neutral-900 bg-white min-h-screen overflow-x-hidden">
      <main className="flex-grow container mx-auto px-4 pt-[64px]">
        {/* Breadcrumb */}
        <div className="flex justify-between items-center mb-[24px]">
          <Breadcrumb
            items={[
              { label: "Home", url: "/" },
              { label: "Conjuntos de dados", url: "/pages/datasets" },
              { label: dataset.title, url: `/pages/datasets/${dataset.slug}` },
            ]}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-[16px] mb-[24px]">
          {dataset.private && <Pill variant="warning">Rascunho</Pill>}
          {dataset.archived && <Pill variant="neutral">Arquivado</Pill>}
          <Button
            variant="primary"
            appearance={isFavorite ? "solid" : "outline"}
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

        <div className="grid md:grid-cols-3 xl:grid-cols-12 gap-32 mb-[24px]">
          {/* Main Content Column */}
          <div className="xl:col-span-6 xl:block">
            <div className="flex flex-col gap-4" ref={titleRef}>
              <h1 className="text-xl-bold text-primary-900 leading-tight mb-24">{dataset.title}</h1>
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
            <div className="flex flex-col h-fit" ref={sidebarRef}>
              <div className="flex flex-col gap-16 bg-[#F2F6FF] rounded-4 p-32 mb-16">
                {dataset.organization?.logo ? (
                  <div className="w-fit h-[48px] card-article-3_2-img py-8 rounded-8 border-2 border-primary-300 flex items-center justify-center">
                    <img
                      src={dataset.organization.logo}
                      alt={dataset.organization.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-fit px-12 py-6 bg-neutral-100 rounded-8 border border-neutral-200 flex items-center justify-center text-neutral-400">
                    <Icon name="agora-line-building" className="w-6 h-6" />
                  </div>
                )}

                <div className="space-y-16">
                  <div className="text-neutral-900 text-m-light mb-[8px]">
                    {dataset.organization ? (
                      <Link
                        href={`/pages/organizations/${dataset.organization.slug}`}
                        className="hover:underline"
                      >
                        {dataset.organization.name}
                      </Link>
                    ) : (
                      "Organização Desconhecida"
                    )}
                  </div>
                  <div className="text-neutral-900 text-sm mb-[16px]">
                    <span className="text-m-semibold">Última atualização:</span>{" "}
                    {new Date(dataset.last_modified).toLocaleDateString("pt-PT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  {dataset.license && (
                    <div className="text-sm">
                      <a
                        href={
                          dataset.license_url ||
                          `https://dados.gov.pt/pt/licenses/${dataset.license}/`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 underline"
                      >
                        <span className="text-m-semibold">Licença:</span>{" "}
                        {dataset.license_title || dataset.license}
                      </a>
                    </div>
                  )}
                  {dataset.contact_points && dataset.contact_points.length > 0 && (
                    <div className="border-t border-neutral-200 pt-16 flex flex-col gap-12">
                      {dataset.contact_points.map((cp) => (
                        <div key={cp.id} className="text-sm">
                          <div className="text-m-semibold mb-4">
                            {CONTACT_ROLE_LABELS[cp.role] ?? cp.role}
                          </div>
                          <div className="text-neutral-900 mb-4">{cp.name}</div>
                          {cp.email && (
                            <a
                              href={`mailto:${cp.email}`}
                              className="text-primary-600 underline break-all block"
                            >
                              {cp.email}
                            </a>
                          )}
                          {cp.contact_form && (
                            <a
                              href={cp.contact_form}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 underline block"
                            >
                              Formulário de contacto
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-16 mb-16">
                <div className="bg-[#F2F6FF] rounded-4 p-32">
                  <div className="text-sm mb-[8px]">Visualizações</div>
                  <div className="text-l-semibold font-bold text-neutral-900 mb-[8px]">
                    {formatMetricValue(dataset.metrics?.views)}
                  </div>
                </div>
                <div className="bg-[#F2F6FF] rounded-4 p-32">
                  <div className="text-sm mb-[8px]">Downloads</div>
                  <div className="text-l-semibold font-bold text-neutral-900 mb-[8px]">
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
                  <div className="flex flex-col gap-4 mt-8">
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
                      {qualityScore}%
                      {qualityDetails.length > 0 && ` (${qualityDetails.join(", ")})`}
                    </div>
                  </div>
                }
                accordionHeadingTitle={
                  qualityExpanded ? "Fechar informação" : "Ver mais informação"
                }
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
                          className="w-[20px] h-[20px] fill-[#B06112]"
                        />
                        <span className="text-neutral-900 text-base">
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
    </div>
  );
}
