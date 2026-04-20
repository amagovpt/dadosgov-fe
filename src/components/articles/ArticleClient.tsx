"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CardGeneral,
  InputSearchBar,
  InputSelect,
  DropdownSection,
  DropdownOption,
  Icon,
} from "@ama-pt/agora-design-system";
import PageBanner from "@/components/PageBanner";
import { Pagination } from "@/components/Pagination";

import { fetchPosts } from "@/services/api";
import { Post } from "@/types/api";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const PAGE_SIZE = 12;

const SORT_OPTIONS: Record<string, string> = {
  recentes: "-published",
  antigos: "published",
  visualizados: "-last_modified",
};

function SortSelect({
  currentSortKey,
  onSortChange,
}: {
  currentSortKey: string;
  onSortChange: (value: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const selectRef = useRef<any>(null);
  const lastValue = useRef(currentSortKey);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const selected = selectRef.current?.selectedOptions?.[0]?.value;
      if (selected && selected !== lastValue.current) {
        lastValue.current = selected;
        onSortChange(selected);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [mounted, onSortChange]);

  if (!mounted) {
    const labels: Record<string, string> = {
      recentes: "Mais recentes",
      antigos: "Mais antigos",
      visualizados: "Mais visualizados",
    };
    return (
      <div className="selectArticle">
        <label className="text-s-regular text-neutral-700 mb-4 block">Ordenar por :</label>
        <div className="w-full border border-neutral-300 rounded-8 px-16 py-12 text-m-regular text-neutral-900 bg-white">
          {labels[currentSortKey] || "Mais recentes"}
        </div>
      </div>
    );
  }

  return (
    <InputSelect
      label="Ordenar por :"
      id="sort-articles"
      className="selectArticle"
      ref={selectRef}
    >
      <DropdownSection name="order">
        <DropdownOption value="recentes" selected={currentSortKey === "recentes"}>
          Mais recentes
        </DropdownOption>
        <DropdownOption value="antigos" selected={currentSortKey === "antigos"}>
          Mais antigos
        </DropdownOption>
        <DropdownOption value="visualizados" selected={currentSortKey === "visualizados"}>
          Mais visualizados
        </DropdownOption>
      </DropdownSection>
    </InputSelect>
  );
}

export default function ArticleClient({ currentPage }: { currentPage: number }) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState("recentes");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      try {
        const sort = SORT_OPTIONS[sortKey] || "-published";
        const response = await fetchPosts(currentPage, PAGE_SIZE, sort, searchQuery || undefined);
        setPosts(response.data);
        setTotal(response.total);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPosts();
  }, [currentPage, sortKey, searchQuery]);

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
  };

  const formatPostDate = (post: Post): string => {
    const dateStr = post.published || post.created_at;
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: pt });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-neutral-900 bg-neutral-50 filters article">
      <main className="grow bg-primary-50">
        <PageBanner
          title="Últimas novidades"
          backgroundImageUrl="/Banner/hero-bg.png"
          backgroundPosition="center right"
          breadcrumbItems={[
            { label: "Home", url: "/" },
            { label: "Últimas novidades", url: "/pages/posts" },
          ]}
        >
          <InputSearchBar
            label="O que procura nas novidades?"
            placeholder="Pesquisar artigos, notícias, webinars..."
            id="articles-search"
            hasVoiceActionButton={false}
            voiceActionAltText="Pesquisar por voz"
            searchActionAltText="Pesquisar"
            darkMode={true}
            minLength={1}
            value={searchInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); }}
            onSearchActivate={() => handleSearch()}
          />
          <div className="mt-8 text-s-regular text-neutral-200">
            Exemplos: &quot;webinar&quot;, &quot;estudos&quot;, &quot;eventos&quot;
          </div>
        </PageBanner>

        <div className="container mx-auto md:gap-32 xl:gap-64">
          <div className="pt-32 pb-64">
            <div className="grid md:grid-cols-2 xl:grid-cols-12 gap-32 mb-16 items-center mt-[12px]">
              <span className="text-neutral-900 font-medium text-base xl:col-span-7 mt-[32px]">
                {isLoading ? "A carregar..." : `${total} Resultados`}
              </span>
              <div className="w-full md:w-auto xl:col-span-5 flex items-end gap-16 justify-end">
                <div className="grow max-w-[240px]">
                  <SortSelect currentSortKey={sortKey} onSortChange={setSortKey} />
                </div>
              </div>
            </div>

            <div className="divider-neutral-200 mt-[14px] mb-24" />

            {isLoading ? null : posts.length === 0 ? (
              <div className="flex justify-center py-64">
                <span className="text-neutral-600">Nenhum artigo encontrado.</span>
              </div>
            ) : (
              <div className="grid xs:grid-cols-1 sm:grid-cols-2 gap-32">
                {posts.map((post) => {
                  const authorName = post.owner
                    ? `${post.owner.first_name} ${post.owner.last_name}`.trim()
                    : "";

                  return (
                    <Link
                      key={post.id}
                      href={`/pages/posts/${post.slug}`}
                      className="card-general-listing rounded-[4px] overflow-hidden h-full flex flex-col"
                    >
                      <CardGeneral
                        variant="neutral-100"
                        image={{
                          src: post.image_thumbnail || post.image || "/laptop.png",
                          alt: post.name,
                          height: "56px",
                          className: "bg-primary-100 !object-contain !h-[56px]",
                        }}
                        subtitleText={
                          (
                            <div className="flex flex-col">
                              <span style={{ fontSize: "16px" }} className="text-neutral-900">
                                {formatPostDate(post)}
                              </span>
                              {authorName && (
                                <span style={{ fontSize: "16px", fontWeight: 300 }} className="text-neutral-900 mt-4">
                                  {authorName}
                                </span>
                              )}
                            </div>
                          ) as unknown as string
                        }
                        titleText={post.name}
                        descriptionText={
                          (
                            <div className="flex flex-col grow">
                              {post.headline && (
                                <p className="text-m-regular text-neutral-800 line-clamp-3 mb-16">
                                  {post.headline}
                                </p>
                              )}
                              <div className="mt-auto">
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
                          href: `/pages/posts/${post.slug}`,
                        }}
                      />
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="pb-64 mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalItems={total}
                pageSize={PAGE_SIZE}
                baseUrl="/pages/posts"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
