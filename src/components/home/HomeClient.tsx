"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, CardArticle } from "@ama-pt/agora-design-system";
import Link from "next/link";
import { Dataset, Post, Reuse, SiteMetrics } from "@/types/api";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import CardMetrics, { CardMetricsProps } from "../Primitives/Cards/CardMetrics";
import { Datastory, UsedDailyBy } from "@/types/home";
import { getAssets } from "@/utils/getAssets";
import HeroGeneral from "../HeroGeneral";
import PublishDropdown from "../admin/PublishDropdown";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import Image from "next/image";
import AppIcon from "../Primitives/AppIcon";

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
  datastories: Datastory[];
  latestReuses: Reuse[];
  posts: Post[];
  usedDailyBy?: UsedDailyBy[];
}

export default function HomeClient({
  siteMetrics,
  latestDatasets,
  datastories,
  latestReuses,
  posts,
  usedDailyBy
}: HomeClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);
  const publishDropdownWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        publishDropdownWrapperRef.current &&
        !publishDropdownWrapperRef.current.contains(e.target as Node)
      ) {
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
    <main className="w-full h-full">
      <div className="w-full ">
        <div className="w-full">
          <HeroGeneral
            title={
              <h1 className="text-white flex flex-col items-start leading-tight">
                <span className="text-2xl-bold">
                  Portal aberto
                </span>
                <span className="text-2xl-regular">
                  de dados públicos portugueses
                </span>
              </h1>
            }
            subtitle={
              <span className="text-white text-m-regular">
                <p className="">
                  Aceda, explore e reutilize dados públicos de forma transparente e acessível.
                  Milhares de conjuntos de dados ao seu dispor.
                </p>
              </span>
            }
          >
            <PublishDropdown darkMode={true} outline={false} />
          </HeroGeneral>

          {/* Stats Section */}
          <div className="py-64 bg-primary-900 text-white flex flex-col items-center justify-center">
            <div className="container">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-24">
                {/* Reutilizações */}
                <div className="flex items-center gap-16">
                  <div className="px-24 py-24 rounded-8 border-2 border-focus text-focus">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 15 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-24 h-24"
                    >
                      <path
                        d="M0 22.9091V15.2727C0 14.6702 0.479695 14.1818 1.07143 14.1818C1.66316 14.1818 2.14286 14.6702 2.14286 15.2727V22.9091C2.14286 23.5116 1.66316 24 1.07143 24C0.479695 24 0 23.5116 0 22.9091ZM6.42857 22.9091V1.09091C6.42857 0.488417 6.90827 0 7.5 0C8.09173 0 8.57143 0.488417 8.57143 1.09091V22.9091C8.57143 23.5116 8.09173 24 7.5 24C6.90827 24 6.42857 23.5116 6.42857 22.9091ZM12.8571 22.9091V9.81818C12.8571 9.21569 13.3368 8.72727 13.9286 8.72727C14.5203 8.72727 15 9.21569 15 9.81818V22.9091C15 23.5116 14.5203 24 13.9286 24C13.3368 24 12.8571 23.5116 12.8571 22.9091Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-6">
                      <span className="text-2xl-bold">
                        {formatStatNumber(stats?.reuses ?? 0).number}
                      </span>
                      {formatStatNumber(stats?.reuses ?? 0).suffix && (
                        <span className="text-m-bold">
                          {formatStatNumber(stats?.reuses ?? 0).suffix}
                        </span>

                      )}
                    </div>
                    <span className="text-m-regular">Reutilizações</span>
                  </div>
                </div>
                {/* Utilizadores */}
                <div className="flex items-center gap-16">
                  <div className="px-24 py-24 rounded-8 border-2 border-[#FFD700] text-[#FFD700]">
                    <AppIcon
                      name="agora-line-user-group"
                      aria-hidden="true"
                      className="w-24 h-24 fill-[#FFD700]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-6">
                      <span className="text-2xl-bold">
                        {formatStatNumber(stats?.users ?? 0).number}
                      </span>
                      {formatStatNumber(stats?.users ?? 0).suffix && (
                        <span className="text-m-bold">
                          {formatStatNumber(stats?.users ?? 0).suffix}
                        </span>
                      )}
                    </div>
                    <span className="text-m-regular">Utilizadores</span>
                  </div>
                </div>
                {/* Conjuntos de dados */}
                <div className="flex items-center gap-16">
                  <div className="px-24 py-24 rounded-8 border-2 border-[#A6D5FF] text-[#A6D5FF]">
                    <AppIcon
                      name="agora-line-layers-menu"
                      aria-hidden="true"
                      className="w-24 h-24 fill-[#A6D5FF]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-6">
                      <span className="text-2xl-bold">
                        {formatStatNumber(stats?.datasets ?? 0).number}
                      </span>
                      {formatStatNumber(stats?.datasets ?? 0).suffix && (
                        <span className="text-m-bold">
                          {formatStatNumber(stats?.datasets ?? 0).suffix}
                        </span>
                      )}
                    </div>
                    <span className="text-m-regular">Conjuntos de dados</span>
                  </div>
                </div>
                {/* Organizações */}
                <div className="flex items-center gap-16">
                  <div className="px-24 py-24 rounded-8 border-2 border-[#CBFF3F] !text-[#CBFF3F]">
                    <AppIcon
                      name="agora-line-buildings"
                      aria-hidden="true"
                      className="w-24 h-24 fill-[#CBFF3F]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-6">
                      <span className="text-2xl-bold">
                        {formatStatNumber(stats?.organizations ?? 0).number}
                      </span>
                      {formatStatNumber(stats?.organizations ?? 0).suffix && (
                        <span className="text-m-bold">
                          {formatStatNumber(stats?.organizations ?? 0).suffix}
                        </span>
                      )}
                    </div>
                    <span className="text-m-regular">Organizações</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Datasets */}
        <section className="w-full flex flex-col items-center justify-center pt-64">
          <div className="container flex flex-col gap-32">
            <h2 className="text-xl-bold text-primary-900">Conjuntos de dados</h2>
            <div className="grid gap-32 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {latestDatasets.length > 0 ? (
                latestDatasets.map((dataset, index) => {
                  const timeAgo = formatDateToTimeAgo(dataset.last_modified);
                  const cardProps = {
                    ...dataset,
                    last_modified: timeAgo,
                    link: `/pages/datasets/${dataset.slug}`,
                  } as CardMetricsProps;
                  return <CardMetrics key={`featured-dataset-${index}`} {...cardProps} />;
                })
              ) : (
                <div className="py-32 text-center text-neutral-500 xl:col-span-3">
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
        </section>

        {/* Data Stories */}
        <section className="w-full flex flex-col items-center justify-center bg-primary-900 py-64">
          <div className="container flex flex-col gap-32">
            <h2 className="text-xl-bold text-white">Data Stories</h2>
            <p className="mb-32 mt-16 max-w-3xl text-white">
              Histórias contadas com dados abertos — análises e visualizações sobre temas de
              interesse público.
            </p>
            {datastories && datastories.length > 0 ? (
              <>
                <div className="storytellings grid gap-32 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {datastories.map((story) => (
                    <CardArticle
                      key={story.slug}
                      variant="indented"
                      image={{
                        src:
                          story.image && story.image[0]
                            ? getAssets(story.image[0].id)
                            : "/card-full-image.png",
                        alt: story.title,
                      }}
                      subtitle={
                        story.createdAt
                          ? `Publicado a ${format(new Date(story.createdAt), "dd MMM yyyy", { locale: pt })}`
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
                      className="p-0! icon-white h-auto"
                      darkMode={false}
                    >
                      <span className="text-white">Ver todas as Data Stories</span>
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-32 text-center text-neutral-500 xl:col-span-3">
                Nenhum Data Story encontrado.
              </div>
            )}
          </div>
        </section>

        {/* Latest News */}
        <section className="w-full flex flex-col items-center justify-center py-64">
          <div className="container flex flex-col gap-32">
            <h2 className="text-xl-bold text-primary-900">Últimas novidades</h2>
            <div className="grid gap-32 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="latest-news-card-wrapper h-full">
                    <CardArticle
                      image={{
                        src: post.image_thumbnail || post.image || undefined,
                        alt: post.name,
                      }}
                      subtitle={
                        post.created_at
                          ? `Publicado a ${format(new Date(post.created_at), "d MM yyyy", { locale: pt })}`
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
                <div className="py-32 text-center text-neutral-500 xl:col-span-3">
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
        </section>

        {/* Utilizado diariamente por */}
        <section className="w-full flex flex-col items-center justify-center pb-64">
          <div className="container flex flex-col gap-32 ">
            <div className="w-full flex flex-col gap-32">
              <h2 className="text-xl-bold text-primary-900">Utilizado diariamente por:</h2>
              <div className="grid grid-cols-4 xl:grid-cols-10 gap-32 ">
                {usedDailyBy && usedDailyBy.length > 0 ? (
                  usedDailyBy.map((entry, index) => (
                    <div key={index} className="col-span-2 flex items-center justify-center">
                      <Image src={getAssets(entry.logo[0].id)} alt={entry.alt} width={160} height={75} className="object-contain" unoptimized />
                    </div>))
                ) : (
                  <div className="py-32 text-center text-neutral-500 xl:col-span-12">
                    Nenhuma organização encontrada.
                  </div>
                )}
              </div>
            </div>
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
        </section>
      </div>
    </main>
  );
}
