import { useEffect, useRef, useState } from "react";
import { CardGeneral, Icon, usePopupContext } from "@ama-pt/agora-design-system";
import { searchReuses } from "@/service/api/search";
import type { Reuse } from "@/service/types/reuse";
import type { FeaturedReusesData } from "../editorial-blocks";
import { DeleteBlockPopupContent } from "./DeleteBlockPopupContent";
import { getTimeAgoLabel } from "./utils";

export function FeaturedReusesEditor({
  data,
  onChange,
  nameMap,
  onNameMapUpdate,
}: {
  data: FeaturedReusesData;
  onChange: (d: FeaturedReusesData) => void;
  nameMap?: Record<string, Reuse>;
  onNameMapUpdate?: (reuse: Reuse) => void;
}) {
  const { show, hide } = usePopupContext();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Reuse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleRemoveReuse = (index: number) => {
    show(
      <DeleteBlockPopupContent
        onClose={hide}
        onConfirm={() => {
          hide();
          onChange({ ...data, reuseIds: data.reuseIds.filter((_, i) => i !== index) });
        }}
        message="Essa ação é irreversível. Tem a certeza que quer remover esta reutilização?"
      />,
      { title: "Remover reutilização", closeAriaLabel: "Fechar", dimensions: "m" }
    );
  };
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSearch) return;
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearch]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.length < 2) {
      const clearId = window.setTimeout(() => setSearchResults([]), 0);
      return () => window.clearTimeout(clearId);
    }
    searchTimeoutRef.current = setTimeout(() => {
      void (async () => {
        setIsSearching(true);
        try {
          const response = await searchReuses(searchQuery, 1, 8);
          setSearchResults(response.data.filter((r) => !data.reuseIds.includes(r.id)));
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      })();
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, data.reuseIds]);

  const handleSelectReuse = (reuse: Reuse) => {
    onChange({ ...data, reuseIds: [...data.reuseIds, reuse.id] });
    onNameMapUpdate?.(reuse);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="rounded-8 bg-white py-24">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="As minhas reutilizações"
        className="text-xl mb-4 w-full border-none font-bold text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />
      <input
        type="text"
        value={data.legend}
        onChange={(e) => onChange({ ...data, legend: e.target.value })}
        placeholder="Adicionar legenda"
        className="text-sm mb-[20px] w-full border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />

      <div className="grid grid-cols-3 gap-16">
        {data.reuseIds.map((id, index) => {
          const reuse = nameMap?.[id];
          const formatMetric = (value: number | undefined) => {
            if (!value) return "0";
            if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
            if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
            return String(value);
          };
          const timeAgo = getTimeAgoLabel(reuse?.last_modified);

          return (
            <div key={id} className="relative">
              <div className="card-general-listing flex h-full flex-col overflow-hidden rounded-4">
                <CardGeneral
                  variant="white"
                  image={{
                    src:
                      reuse?.image_thumbnail ||
                      reuse?.organization?.logo ||
                      "/images/placeholders/organization.png",
                    alt: reuse?.title || "Reutilização",
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
                          className="mt-4 text-neutral-900"
                        >
                          {reuse?.organization?.name || "Sem Organização"}
                        </span>
                      </div>
                    ) as unknown as string
                  }
                  titleText={reuse?.title || id}
                  descriptionText={
                    (
                      <div className="flex grow flex-col">
                        <p className="mb-16 line-clamp-3 text-m-regular text-neutral-800">
                          {reuse?.description}
                        </p>
                        <div className="mt-auto">
                          <div className="text-xs mt-12 flex flex-wrap items-center gap-8 text-neutral-700">
                            <div className="flex items-center gap-8" title="Visualizações">
                              <Icon
                                name="agora-solid-eye"
                                dimensions="xs"
                                className="fill-neutral-700"
                                aria-hidden="true"
                              />
                              <span>{formatMetric(reuse?.metrics?.views)}</span>
                            </div>
                            <div className="flex items-center gap-8" title="Favoritos">
                              <Icon
                                name="agora-solid-star"
                                dimensions="xs"
                                className="fill-neutral-700"
                                aria-hidden="true"
                              />
                              <span>{formatMetric(reuse?.metrics?.followers)}</span>
                            </div>
                          </div>
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
                  anchor={{ href: reuse?.slug ? `/reuses/${reuse.slug}` : "#" }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveReuse(index)}
                className="rounded group absolute right-8 top-8 z-10 p-4"
                title="Remover"
              >
                <Icon
                  name="agora-line-trash"
                  className="block h-[18px] w-[18px] !fill-[var(--color-danger-600)] group-hover:hidden"
                />
                <Icon
                  name="agora-solid-trash"
                  className="hidden h-[18px] w-[18px] !fill-[var(--color-danger-600)] group-hover:block"
                />
              </button>
            </div>
          );
        })}

        {data.reuseIds.length < 6 && !showSearch && (
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="flex min-h-[200px] flex-col items-center justify-center rounded-8 border-2 border-dashed border-neutral-300 text-neutral-900 transition-colors hover:border-neutral-400"
          >
            <Icon name="agora-line-plus-circle" className="mb-4 h-[20px] w-[20px]" />
            <span className="text-xs">Adicione uma reutilização</span>
          </button>
        )}

        {showSearch && (
          <div ref={searchContainerRef} className="relative mt-8 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar reutilização..."
              className="text-sm w-full rounded-8 border border-neutral-300 px-12 py-[10px] outline-none focus:border-primary-500"
              autoFocus
            />
            {isSearching && <p className="text-xs mt-4 text-neutral-400">A pesquisar...</p>}
            {searchResults.length > 0 && (
              <ul className="shadow-lg absolute z-10 mt-4 max-h-[240px] w-full overflow-y-auto rounded-8 border border-neutral-200 bg-white">
                {searchResults.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectReuse(r)}
                      className="text-sm w-full px-12 py-8 text-left transition-colors hover:bg-neutral-50"
                    >
                      <span className="font-medium text-neutral-800">{r.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <p className="text-xs mt-4 text-neutral-400">Nenhum resultado encontrado</p>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="text-xs mt-4 text-neutral-400 hover:text-neutral-600"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
