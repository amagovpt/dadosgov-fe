"use client";

import React, { useEffect, useSyncExternalStore, useRef, useState } from "react";
import Link from "next/link";
import {
  CardGeneral,
  InputSearchBar,
  InputSelect,
  DropdownSection,
  DropdownOption,
  Icon,
  InputSelectRef,
} from "@ama-pt/agora-design-system";
import HeroGeneral from "@/components/HeroGeneral";
import { Pagination } from "@/components/Pagination";

import { fetchPosts } from "@/service/api/posts";
import { Post } from "@/service/types/posts";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import ResultsCount from "../admin/ResultsCount";

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
  const selectRef = useRef<InputSelectRef>(null);
  const lastValue = useRef(currentSortKey);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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
        <label className="mb-4 block text-s-regular text-neutral-700">Ordenar por :</label>
        <div className="w-full rounded-8 border border-neutral-300 bg-white px-16 py-12 text-m-regular text-neutral-900">
          {labels[currentSortKey] || "Mais recentes"}
        </div>
      </div>
    );
  }

  return (
    <InputSelect label="Ordenar por :" id="sort-articles" className="selectArticle" ref={selectRef}>
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
    <main className="flex w-full flex-col items-center justify-center bg-primary-50">
      <HeroGeneral
        title="Últimas novidades"
        backgroundImageUrl="/Banner/hero-bg.png"
        breadcrumbItems={[
          { label: "Home", url: "/" },
          { label: "Últimas novidades", url: "/posts" },
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
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") handleSearch();
          }}
          onSearchActivate={() => handleSearch()}
        />
        <div className="mt-8 text-s-regular text-neutral-200">
          Exemplos: &quot;webinar&quot;, &quot;estudos&quot;, &quot;eventos&quot;
        </div>
      </HeroGeneral>
      <div className="container flex flex-col items-center justify-center gap-32 py-32">
        <div className="flex w-full flex-col items-center justify-end">
          <div className="flex w-full items-end gap-16">
            <ResultsCount
              count={total}
              isLoading={isLoading}
              className="w-full text-base font-medium text-neutral-900"
            />
            <div className="flex w-full items-end justify-end gap-16">
              <div className="max-w-256">
                <SortSelect currentSortKey={sortKey} onSortChange={setSortKey} />
              </div>
            </div>
          </div>

          <div className="divider-neutral-200 mb-24 mt-12" />
          {isLoading ? null : posts.length === 0 ? (
            <div className="flex justify-center py-64">
              <span className="text-neutral-600">Nenhum artigo encontrado.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-32 lg:grid-cols-2">
              {posts.map((post) => {
                return (
                  <Link
                    key={post.id}
                    href={`/posts/${post.slug}`}
                    className="card-general-listing flex h-full flex-col overflow-hidden rounded-4"
                  >
                    <CardGeneral
                      variant="neutral-100"
                      image={{
                        src: post.image_thumbnail || post.image || "/laptop.png",
                        alt: post.name,
                        height: "56px",
                        className: "bg-primary-100 !object-contain !h-56",
                      }}
                      subtitleText={
                        (
                          <span className="text-m-regular text-neutral-900">
                            {formatPostDate(post)}
                          </span>
                        ) as unknown as string
                      }
                      titleText={post.name}
                      descriptionText={
                        (
                          <div className="flex grow flex-col">
                            {post.headline && (
                              <p className="mb-16 line-clamp-3 text-m-regular text-neutral-800">
                                {post.headline}
                              </p>
                            )}
                            <div className="mt-auto">
                              <div className="mt-16 flex items-center gap-8 text-primary-600">
                                <Icon
                                  name="agora-line-arrow-right-circle"
                                  className="h-32 w-32"
                                  aria-hidden="true"
                                />
                              </div>
                            </div>
                          </div>
                        ) as unknown as string
                      }
                      isBlockedLink={true}
                      anchor={{
                        href: `/posts/${post.slug}`,
                      }}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalItems={total}
            pageSize={PAGE_SIZE}
            baseUrl="/posts"
          />
        </div>
      </div>
    </main>
  );
}
