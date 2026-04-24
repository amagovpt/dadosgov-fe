"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Icon,
  CardArticle,
  CardGeneral,
  ProgressBar,
} from "@ama-pt/agora-design-system";
import Link from "next/link";
import { Dataset, Post, Reuse, SiteMetrics } from "@/types/api";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";

function formatStatNumber(value: number): { number: string; suffix: string } {
  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1).replace(".", ",");
    return { number: formatted, suffix: "milhões" };
  }
  if (value >= 1_000) {
    const parts: string[] = [];
    let remaining = value;
    while (remaining >= 1000) {
      parts.unshift(String(remaining % 1000).padStart(3, "0"));
      remaining = Math.floor(remaining / 1000);
    }
    parts.unshift(String(remaining));
    const formatted = parts.join("\u2009");
    return { number: formatted, suffix: "" };
  }
  return { number: String(value), suffix: "" };
}

interface HomeClientProps {
  siteMetrics: SiteMetrics;
  latestDatasets: Dataset[];
  latestReuses: Reuse[];
  posts: Post[];
}

export default function HomeClient({ siteMetrics, latestDatasets, latestReuses, posts }: HomeClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);
  const publishDropdownWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (publishDropdownWrapperRef.current && !publishDropdownWrapperRef.current.contains(e.target as Node)) {
        setShowPublishDropdown(false);
      }
    }
    if (showPublishDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPublishDropdown]);

  const stats = siteMetrics;

  return (
    <main className="flex-grow">
      <div className="w-full homepage">
        {/* Hero Section */}
        <div
          className="agora-card-highlight-newsletter"
          style={{
            backgroundImage: 'url("/Banner/hero-bg.png")',
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "right top 40%",
          }}
        >
          <div className="card-container">
            <div className="card-content">
              <div className="title">
                <h1 className="container mx-auto text-white flex flex-col items-start leading-tight">
                  <span className="xs:text-xl-bold md:text-2xl-bold xl:text-2xl-bold">
                    Portal aberto
                  </span>
                  <span className="xs:text-xl-light md:text-2xl-light xl:text-2xl-light">
                    de dados públicos portugueses
                  </span>
                </h1>
              </div>
              <div className="subtitle">
                <div className="container mx-auto text-left">
                  <p className="max-w-ch">
                    Aceda, explore e reutilize dados públicos de forma transparente e acessível.
                    Milhares de
                    <br />
                    conjuntos de dados ao seu dispor.
                  </p>
                </div>
              </div>
            </div>
            <div className="input-container">
              <div className="email-bar">
                <div className="container mx-auto grid xs:grid-cols-4 md:grid-cols-8 xl:grid-cols-12 gap-32 ">
                  <div className="xs:col-span-4 md:col-span-7 xl:col-span-7">
                    <div
                      className="relative inline-block publish-dropdown-wrapper publish-dropdown-hero"
                      ref={publishDropdownWrapperRef}
                    >
                      <Button
                        variant="primary"
                        darkMode={true}
                        hasIcon={true}
                        trailingIcon={showPublishDropdown ? "agora-line-chevron-up" : "agora-line-chevron-down"}
                        trailingIconHover={showPublishDropdown ? "agora-solid-chevron-up" : "agora-solid-chevron-down"}
                        className="px-24 py-16 h-auto relative z-10"
                        style={{ borderRadius: "4px" }}
                        onClick={() => {
                          if (!user) {
                            router.push("/pages/login");
                            return;
                          }
                          setShowPublishDropdown((v) => !v);
                        }}
                      >
                        <span className="text-lg font-medium">
                          Publicar <span className="font-bold">dados.gov.pt</span>
                        </span>
                      </Button>
                      {showPublishDropdown && (
                        <div className="publish-custom-dropdown">
                          {[
                            { icon: "agora-line-layers-menu", label: "Um conjunto de dados", href: "/pages/admin/datasets/new" },
                            { icon: null, customIcon: "/Icons/bar_chart_primary.svg", label: "Uma reutilização", href: "/pages/admin/reuses/new" },
                            { icon: "agora-line-award", label: "Um harvester", href: "/pages/admin/harvesters/new" },
                            { icon: "agora-line-buildings", label: "Uma organização", href: "/pages/admin/organizations/new" },
                          ].map((item, index) => (
                            <button
                              key={index}
                              className="publish-custom-dropdown__item"
                              onClick={() => {
                                setShowPublishDropdown(false);
                                router.push(item.href);
                              }}
                            >
                              {item.icon ? (
                                <Icon name={item.icon} className="w-[24px] h-[24px] text-primary-600" />
                              ) : (
                                <img src={item.customIcon} alt="" className="w-[24px] h-[24px]" aria-hidden="true" />
                              )}
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-32 bg-primary-900 text-white -mt-8 relative z-20 rounded-t-3xl shadow-top-low md:mt-0 md:border-none md:shadow-none">
          <div className="container mx-auto px-4">
            <div className="grid xs:grid-cols-4 lg:grid-cols-4 gap-24">
              {/* Reutilizações */}
              <div className="flex items-center gap-16">
                <div className="stats-icon-square border-2 border-[#D600FF] text-[#D600FF]">
                  <svg
                    width="15"
                    height="24"
                    viewBox="0 0 15 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-[15px] h-[24px]"
                  >
                    <path
                      d="M0 22.9091V15.2727C0 14.6702 0.479695 14.1818 1.07143 14.1818C1.66316 14.1818 2.14286 14.6702 2.14286 15.2727V22.9091C2.14286 23.5116 1.66316 24 1.07143 24C0.479695 24 0 23.5116 0 22.9091ZM6.42857 22.9091V1.09091C6.42857 0.488417 6.90827 0 7.5 0C8.09173 0 8.57143 0.488417 8.57143 1.09091V22.9091C8.57143 23.5116 8.09173 24 7.5 24C6.90827 24 6.42857 23.5116 6.42857 22.9091ZM12.8571 22.9091V9.81818C12.8571 9.21569 13.3368 8.72727 13.9286 8.72727C14.5203 8.72727 15 9.21569 15 9.81818V22.9091C15 23.5116 14.5203 24 13.9286 24C13.3368 24 12.8571 23.5116 12.8571 22.9091Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-[6px]">
                    <span className="text-xl-bold">
                      {formatStatNumber(stats?.reuses ?? 0).number}
                    </span>
                    {formatStatNumber(stats?.reuses ?? 0).suffix && (
                      <span className="text-m-bold">
                        {formatStatNumber(stats?.reuses ?? 0).suffix}
                      </span>
                    )}
                  </div>
                  <span className="text-s-regular">Reutilizações</span>
                </div>
              </div>

              {/* Utilizadores */}
              <div className="flex items-center gap-16">
                <div className="stats-icon-square border-2 border-[#FFD700] text-[#FFD700]">
                  <Icon
                    name="agora-line-user-group"
                    aria-hidden="true"
                    className="w-[24px] h-[24px]"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-[6px]">
                    <span className="text-xl-bold">
                      {formatStatNumber(stats?.users ?? 0).number}
                    </span>
                    {formatStatNumber(stats?.users ?? 0).suffix && (
                      <span className="text-m-bold">
                        {formatStatNumber(stats?.users ?? 0).suffix}
                      </span>
                    )}
                  </div>
                  <span className="text-s-regular">Utilizadores</span>
                </div>
              </div>

              {/* Conjuntos de Dados */}
              <div className="flex items-center gap-16">
                <div className="stats-icon-square border-2 border-[#A6D5FF] text-[#A6D5FF]">
                  <Icon
                    name="agora-line-layers-menu"
                    aria-hidden="true"
                    className="w-[24px] h-[24px]"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-[6px]">
                    <span className="text-xl-bold">
                      {formatStatNumber(stats?.datasets ?? 0).number}
                    </span>
                    {formatStatNumber(stats?.datasets ?? 0).suffix && (
                      <span className="text-m-bold">
                        {formatStatNumber(stats?.datasets ?? 0).suffix}
                      </span>
                    )}
                  </div>
                  <span className="text-s-regular">Conjuntos de Dados</span>
                </div>
              </div>

              {/* Organizações */}
              <div className="flex items-center gap-16">
                <div className="stats-icon-square border-2 border-[#CBFF3F] text-[#CBFF3F]">
                  <Icon
                    name="agora-line-buildings"
                    aria-hidden="true"
                    className="w-[24px] h-[24px]"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-[6px]">
                    <span className="text-xl-bold">
                      {formatStatNumber(stats?.organizations ?? 0).number}
                    </span>
                    {formatStatNumber(stats?.organizations ?? 0).suffix && (
                      <span className="text-m-bold">
                        {formatStatNumber(stats?.organizations ?? 0).suffix}
                      </span>
                    )}
                  </div>
                  <span className="text-s-regular">Organizações</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Datasets */}
        <div className="xl:pt-64 pb-64 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-xl-bold mb-32 text-primary-900 ">Conjuntos de dados</h2>

            <div className="grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-32">
              {latestDatasets.length > 0 ? (
                latestDatasets.map((dataset) => {
                  const qualityScore = dataset.quality?.score != null
                    ? Math.round(dataset.quality.score * 100)
                    : 0;
                  const formatMetric = (value: number | undefined) => {
                    if (!value) return "0";
                    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
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
                        variant="neutral-100"
                        image={{
                          src: dataset.organization?.logo || "/images/placeholders/organization.png",
                          alt: dataset.organization?.name || "Organização",
                          height: "56px",
                          className: "bg-primary-100 !object-contain !h-[56px]",
                        }}
                        subtitleText={
                          (
                            <div className="flex flex-col">
                              <span style={{ fontSize: "16px" }} className="text-neutral-900">{timeAgo}</span>
                              <span style={{ fontSize: "16px", fontWeight: 300 }} className="text-neutral-900 mt-4">
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
                              <div className={`mt-auto ${qualityScore <= 45 ? "quality-progress-warning" : qualityScore > 50 ? "quality-progress-success" : ""}`}>
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
                                      name={dataset.metrics?.views ? "agora-solid-eye" : "agora-line-eye"}
                                      dimensions="xs"
                                      className="fill-neutral-700"
                                      aria-hidden="true"
                                    />
                                    <span>{formatMetric(dataset.metrics?.views)}</span>
                                  </div>
                                  <div className="flex items-center gap-8" title="Downloads">
                                    <Icon
                                      name={dataset.metrics?.resources_downloads ? "agora-solid-download" : "agora-line-download"}
                                      dimensions="xs"
                                      className="fill-neutral-700"
                                      aria-hidden="true"
                                    />
                                    <span>{formatMetric(dataset.metrics?.resources_downloads)}</span>
                                  </div>
                                  <div className="flex items-center gap-8" title="Reutilizações">
                                    <img src="/Icons/bar_chart.svg" className="w-16 h-16" alt="" aria-hidden="true" />
                                    <span>{dataset.metrics?.reuses || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-8" title="Favoritos">
                                    <Icon
                                      name={dataset.metrics?.followers ? "agora-solid-star" : "agora-line-star"}
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
                })
              ) : (
                <div className="xl:col-span-3 text-center py-32 text-neutral-500">
                  Nenhum conjunto de dados encontrado.
                </div>
              )}
            </div>
            <div className="mt-32">
              <Link href="/pages/datasets">
                <Button
                  variant="primary"
                  appearance="link"
                  hasIcon={true}
                  trailingIcon="agora-line-arrow-right-circle"
                  trailingIconHover="agora-solid-arrow-right-circle"
                  className="p-0! h-auto"
                >
                  <span>Ver todos os conjuntos de dados</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Data Stories */}
        <div className="xl:py-64 bg-primary-900">
          <div className="container mx-auto px-4">
            <h2 className="text-xl-bold text-white">Data Stories</h2>
            <p className="mt-16 mb-32 max-w-3xl text-white">
              Histórias contadas com dados abertos — análises e visualizações sobre temas de interesse público.
            </p>
            <div className="grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-32 storytellings">
              {[
                {
                  id: "1",
                  slug: "servicos-publicos/o-canal-presencial",
                  title: "Serviços Públicos: o canal presencial",
                  image: "/laptop.png",
                  created_at: "2024-03-11T12:00:00Z",
                },
                {
                  id: "2",
                  slug: "territorios-inteligentes/pressao-turistica-em-portugal",
                  title: "Territórios Inteligentes: Pressão turística em Portugal",
                  image: "/laptop.png",
                  created_at: "2024-03-10T12:00:00Z",
                },
                {
                  id: "3",
                  slug: "servicos-publicos/o-canal-digital",
                  title: "Serviços Públicos: o canal digital",
                  image: "/laptop.png",
                  created_at: "2024-03-09T12:00:00Z",
                },
              ].map((story) => (
                <CardArticle
                  key={story.id}
                  variant="indented"
                  image={{
                    src: story.image,
                    alt: story.title,
                  }}
                  subtitle={
                    story.created_at
                      ? `Publicado a ${format(new Date(story.created_at), "dd MMM yyyy", { locale: pt })}`
                      : ""
                  }
                  title={story.title}
                  mainAnchor={{
                    href: `/pages/datastories/${story.slug}`,
                  }}
                  blockedLink={true}
                />
              ))}
            </div>
            <div className="mt-32">
              <Link href="/pages/datastories">
                <Button
                  variant="primary"
                  appearance="link"
                  hasIcon={true}
                  trailingIcon="agora-line-arrow-right-circle"
                  trailingIconHover="agora-solid-arrow-right-circle"
                  className="p-0! h-auto icon-white"
                  darkMode={false}
                >
                  <span className="text-white">Ver todas as Data Stories</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Latest News */}
        <div className="xl:py-64 bg-white latest-news-section">
          <div className="container mx-auto px-4">
            <h2 className="text-xl-bold mb-32 text-primary-900">Últimas novidades</h2>
            <div className="grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-32">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="latest-news-card-wrapper h-full">
                    <CardArticle
                      image={{
                        src: post.image_thumbnail || post.image || "",
                        alt: post.name,
                      }}
                      subtitle={
                        post.created_at
                          ? `Publicado a ${format(new Date(post.created_at), "d MMM yyyy", { locale: pt })}`
                          : ""
                      }
                      title={post.name}
                      blockedLink={false}
                    >
                      <div className="mt-auto pt-16">
                        <Link href={`/pages/posts/${post.slug}`}>
                          <Button
                            variant="primary"
                            appearance="link"
                            hasIcon={true}
                            trailingIcon="agora-line-arrow-right-circle"
                            trailingIconHover="agora-solid-arrow-right-circle"
                            className="p-0! h-auto"
                          >
                            <span>Ler mais</span>
                          </Button>
                        </Link>
                      </div>
                    </CardArticle>
                  </div>
                ))
              ) : (
                <div className="xl:col-span-3 text-center py-32 text-neutral-500">
                  Nenhuma novidade encontrada.
                </div>
              )}
            </div>
            <div className="mt-32">
              <Link href="/pages/posts">
                <Button
                  variant="primary"
                  appearance="link"
                  hasIcon={true}
                  trailingIcon="agora-line-arrow-right-circle"
                  trailingIconHover="agora-solid-arrow-right-circle"
                  className="p-0! h-auto"
                >
                  <span>Ver todas as novidades</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Utilizado diariamente por */}
        <div className="xl:pb-64 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-xl-bold mb-32 text-primary-900">Utilizado diariamente por:</h2>
            <div className="flex flex-col mt-32">
              <div className="flex flex-wrap items-center justify-between gap-x-32">
                {Array(5).fill("arte_black.svg").map((logo, i) => (
                  <div key={`row1-${i}`} className="flex items-center justify-center">
                    <img
                      src={`/Logos/${logo}`}
                      alt={`Logo ${logo.replace(".svg", "")}`}
                      className="h-[32px] w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-32 mt-32">
                {Array(5).fill("arte_black.svg").map((logo, i) => (
                  <div key={`row2-${i}`} className="flex items-center justify-center">
                    <img
                      src={`/Logos/${logo}`}
                      alt={`Logo ${logo.replace(".svg", "")}`}
                      className="h-[32px] w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-32">
              <Link href="/pages/organizations">
                <Button
                  variant="primary"
                  appearance="link"
                  hasIcon={true}
                  trailingIcon="agora-line-arrow-right-circle"
                  trailingIconHover="agora-solid-arrow-right-circle"
                  className="p-0! h-auto"
                >
                  <span>Ver todas as organizações</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
