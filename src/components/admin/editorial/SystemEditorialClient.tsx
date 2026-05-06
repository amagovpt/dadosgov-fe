"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  Button,
  CardGeneral,
  Icon,
  ProgressBar,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import {
  fetchHomeFeaturedDatasets,
  updateHomeFeaturedDatasets,
  fetchHomeFeaturedReuses,
  updateHomeFeaturedReuses,
  searchDatasets,
  searchReuses,
} from "@/services/api";
import type { Dataset, Reuse } from "@/types/api";
import { formatMetricValue } from "@/utils/formatNumber";

// ─── Block types & definitions ───────────────────────────────────────────────

type BlockType =
  | "hero"
  | "accordion"
  | "featured-datasets"
  | "featured-reuses"
  | "featured-links"
  | "markdown";

interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  iconImg?: string;
  category: string;
}

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "hero",
    label: "Herói",
    description: "Banner de cabeçalho com título e descrição",
    icon: "agora-line-home",
    category: "LAYOUT",
  },
  {
    type: "accordion",
    label: "Acordeão",
    description: "Sumário expansível (FAQ, etc.)",
    icon: "agora-line-folder",
    category: "LAYOUT",
  },
  {
    type: "featured-datasets",
    label: "Dados em destaque",
    description: "Destaque até 4 conjuntos de dados",
    icon: "agora-line-layers-menu",
    category: "CONTEÚDO EM DESTAQUE",
  },
  {
    type: "featured-reuses",
    label: "Reutilização em destaque",
    description: "Destaque até 4 reutilizações",
    icon: "agora-line-bar-chart",
    iconImg: "/Icons/bar_chart_primary.svg",
    category: "CONTEÚDO EM DESTAQUE",
  },
  {
    type: "featured-links",
    label: "Links em destaque",
    description: "Destaque até 4 links",
    icon: "agora-line-external-link",
    category: "CONTEÚDO EM DESTAQUE",
  },
  {
    type: "markdown",
    label: "Bloco Markdown",
    description: "Adicionar conteúdo de texto formatado",
    icon: "agora-line-document",
    category: "TEXTO",
  },
];

// ─── Block data shapes ───────────────────────────────────────────────────────

interface HeroData {
  title: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  color: "blue" | "green" | "red";
}

interface AccordionItemData {
  title: string;
  content: string;
}

interface AccordionData {
  title: string;
  description: string;
  items: AccordionItemData[];
}

interface FeaturedDatasetsData {
  title: string;
  legend: string;
  datasetIds: string[];
}

interface FeaturedReusesData {
  title: string;
  legend: string;
  reuseIds: string[];
}

interface FeaturedLinkItem {
  label: string;
  url: string;
}

interface FeaturedLinksData {
  title: string;
  legend: string;
  paragraphs: string[];
  links: FeaturedLinkItem[];
  buttonLabel: string;
  buttonUrl: string;
}

interface MarkdownData {
  content: string;
}

type BlockData =
  | HeroData
  | AccordionData
  | FeaturedDatasetsData
  | FeaturedReusesData
  | FeaturedLinksData
  | MarkdownData;

interface ContentBlock {
  id: string;
  type: BlockType;
  data: BlockData;
}

const HERO_COLORS: { value: HeroData["color"]; bg: string; ring: string }[] = [
  { value: "blue", bg: "bg-primary-900", ring: "ring-white" },
  { value: "green", bg: "bg-green-800", ring: "ring-white" },
  { value: "red", bg: "bg-red-800", ring: "ring-white" },
];

function getDefaultData(type: BlockType): BlockData {
  switch (type) {
    case "hero":
      return {
        title: "",
        description: "",
        buttonLabel: "",
        buttonUrl: "",
        color: "blue",
      };
    case "accordion":
      return { title: "", description: "", items: [{ title: "", content: "" }] };
    case "featured-datasets":
      return { title: "", legend: "", datasetIds: [] };
    case "featured-reuses":
      return { title: "", legend: "", reuseIds: [] };
    case "featured-links":
      return {
        title: "",
        legend: "",
        paragraphs: [],
        links: [],
        buttonLabel: "",
        buttonUrl: "",
      };
    case "markdown":
      return { content: "" };
  }
}

// ─── Block Picker ────────────────────────────────────────────────────────────

function BlockPicker({ onSelect }: { onSelect: (type: BlockType) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = BLOCK_DEFINITIONS.reduce(
    (acc, block) => {
      if (!acc[block.category]) acc[block.category] = [];
      acc[block.category].push(block);
      return acc;
    },
    {} as Record<string, BlockDefinition[]>
  );

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        appearance="outline"
        variant="primary"
        hasIcon
        leadingIcon="agora-line-plus-circle"
        leadingIconHover="agora-solid-plus-circle"
        onClick={() => setIsOpen(!isOpen)}
      >
        Adicionar um bloco
      </Button>

      {isOpen && (
        <div className="shadow-lg absolute left-1/2 z-20 mt-[4px] w-[320px] -translate-x-1/2 rounded-[8px] border border-neutral-200 bg-white">
          <ul role="menu">
            {Object.entries(categories).map(([category, blocks]) => (
              <li key={category}>
                <p className="text-xs px-[16px] pb-[4px] pt-[12px] font-bold uppercase tracking-wide text-neutral-900">
                  {category}
                </p>
                <ul>
                  {blocks.map((block) => (
                    <li key={block.type}>
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full px-[16px] py-[8px] text-left transition-colors hover:bg-neutral-50"
                        onClick={() => {
                          onSelect(block.type);
                          setIsOpen(false);
                        }}
                      >
                        <span className="flex items-center gap-[8px]">
                          {block.iconImg ? (
                            <img src={block.iconImg} alt="" className="h-[18px] w-[18px]" />
                          ) : (
                            <Icon
                              name={block.icon}
                              className="h-[18px] w-[18px] text-neutral-700"
                            />
                          )}
                          <span className="text-sm font-semibold text-neutral-900">
                            {block.label}
                          </span>
                        </span>
                        <p className="text-xs ml-[26px] mt-[2px] text-neutral-900">
                          {block.description}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Block Editors ───────────────────────────────────────────────────────────

function HeroEditor({ data, onChange }: { data: HeroData; onChange: (d: HeroData) => void }) {
  const colorBg = HERO_COLORS.find((c) => c.value === data.color)?.bg ?? "bg-primary-900";

  return (
    <div className={`${colorBg} rounded-[8px] p-[32px] text-white`}>
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Título"
        className="text-2xl mb-[8px] w-full border-none bg-transparent font-bold placeholder-white/60 outline-none"
      />
      <input
        type="text"
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="Adicione uma descrição"
        className="text-sm mb-[20px] w-full border-none bg-transparent placeholder-white/60 outline-none"
      />
      <div className="mb-[8px]">
        <span className="text-sm inline-block rounded-[6px] border border-white/30 bg-white px-[16px] py-[8px] font-medium text-primary-900">
          <input
            type="text"
            value={data.buttonLabel}
            onChange={(e) => onChange({ ...data, buttonLabel: e.target.value })}
            placeholder="Título do botão"
            className="border-none bg-transparent text-primary-900 placeholder-neutral-400 outline-none"
          />
        </span>
      </div>
      <input
        type="text"
        value={data.buttonUrl}
        onChange={(e) => onChange({ ...data, buttonUrl: e.target.value })}
        placeholder="URL do botão"
        className="text-sm border-orange-400 mb-[16px] w-[300px] max-w-full rounded-[6px] border bg-white px-[12px] py-[6px] text-neutral-800 placeholder-neutral-400 outline-none"
      />
      <div className="flex items-center gap-[8px]">
        <span className="text-sm">Cor :</span>
        {HERO_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange({ ...data, color: c.value })}
            className={`h-[28px] w-[28px] rounded-full border-2 ${
              data.color === c.value ? "border-white ring-2 ring-white/50" : "border-white/40"
            } ${c.bg}`}
          />
        ))}
      </div>
    </div>
  );
}

function AccordionEditor({
  data,
  onChange,
}: {
  data: AccordionData;
  onChange: (d: AccordionData) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const addItem = () => {
    onChange({ ...data, items: [...data.items, { title: "", content: "" }] });
  };

  const updateItem = (index: number, field: "title" | "content", value: string) => {
    const items = [...data.items];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...data, items });
  };

  const removeItem = (index: number) => {
    onChange({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  return (
    <div className="rounded-[8px] bg-white py-[24px]">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Os meus acordeões"
        className="text-xl mb-[4px] w-full border-none font-bold text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />
      <input
        type="text"
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="Adicione uma descrição"
        className="text-sm mb-[20px] w-full border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />

      <div className="flex flex-col">
        {data.items.map((item, index) => (
          <div key={index} className="border-b border-neutral-200">
            <div className="flex items-center justify-between py-[12px]">
              <div className="flex flex-1 items-center gap-[8px]">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  placeholder="Título do item"
                  className="text-sm flex-1 border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
                />
              </div>
              <div className="flex items-center gap-[4px]">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded hover:bg-red-100 text-red-600 p-[4px]"
                >
                  <Icon name="agora-line-trash" className="h-[14px] w-[14px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="rounded p-[4px] text-neutral-500 hover:bg-neutral-100"
                >
                  <Icon
                    name={openIndex === index ? "agora-line-chevron-up" : "agora-line-chevron-down"}
                    className="h-[16px] w-[16px]"
                  />
                </button>
              </div>
            </div>
            {openIndex === index && (
              <div className="pb-[12px]">
                <textarea
                  value={item.content}
                  onChange={(e) => updateItem(index, "content", e.target.value)}
                  placeholder="Conteúdo do item..."
                  rows={3}
                  className="text-sm w-full resize-y rounded-[6px] border border-neutral-200 px-[12px] py-[8px] text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="text-xs mt-[12px] inline-flex items-center gap-[4px] font-medium text-primary-600 hover:text-primary-800"
      >
        <Icon name="agora-line-plus-circle" className="h-[14px] w-[14px]" />
        Adicionar item
      </button>
    </div>
  );
}

function FeaturedDatasetsEditor({
  data,
  onChange,
  nameMap,
  onNameMapUpdate,
}: {
  data: FeaturedDatasetsData;
  onChange: (d: FeaturedDatasetsData) => void;
  nameMap?: Record<string, Dataset>;
  onNameMapUpdate?: (dataset: Dataset) => void;
}) {
  const { show, hide } = usePopupContext();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Dataset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleRemoveDataset = (index: number) => {
    show(
      <DeleteBlockPopupContent
        onClose={hide}
        onConfirm={() => {
          hide();
          onChange({ ...data, datasetIds: data.datasetIds.filter((_, i) => i !== index) });
        }}
        message="Essa ação é irreversível. Tem a certeza que quer remover este conjunto de dados?"
      />,
      { title: "Remover conjunto de dados", closeAriaLabel: "Fechar", dimensions: "m" }
    );
  };

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
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchDatasets(searchQuery, 1, 8);
        setSearchResults(response.data.filter((d) => !data.datasetIds.includes(d.id)));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, data.datasetIds]);

  const handleSelectDataset = (dataset: Dataset) => {
    onChange({ ...data, datasetIds: [...data.datasetIds, dataset.id] });
    onNameMapUpdate?.(dataset);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="rounded-[8px] bg-white py-[24px]">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Os meus conjuntos de dados"
        className="text-xl mb-[4px] w-full border-none font-bold text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />
      <input
        type="text"
        value={data.legend}
        onChange={(e) => onChange({ ...data, legend: e.target.value })}
        placeholder="Adicionar legenda"
        className="text-sm mb-[20px] w-full border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />

      <div className="grid grid-cols-3 gap-[16px]">
        {data.datasetIds.map((id, index) => {
          const dataset = nameMap?.[id];
          const qualityScore =
            dataset?.quality?.score != null ? Math.round(dataset.quality.score * 100) : 0;
          const timeAgo = dataset?.last_modified
            ? formatDistanceToNow(new Date(dataset.last_modified), {
                locale: pt,
                addSuffix: false,
              })
                .replace("menos de ", "")
                .replace("cerca de ", "")
            : "Desconhecido";

          return (
            <div key={id} className="relative">
              <div className="card-general-listing flex h-full flex-col overflow-hidden rounded-[4px]">
                <CardGeneral
                  variant="white"
                  image={{
                    src: dataset?.organization?.logo || "/images/placeholders/organization.png",
                    alt: dataset?.organization?.name || "Organização",
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
                          {dataset?.organization?.name || "Sem Organização"}
                        </span>
                      </div>
                    ) as unknown as string
                  }
                  titleText={dataset?.title || id}
                  descriptionText={
                    (
                      <div className="flex grow flex-col">
                        <p className="mb-16 line-clamp-3 text-m-regular text-neutral-800">
                          {dataset?.description}
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
                          <span className="mt-4 block text-[14px] text-neutral-900">
                            {qualityScore}% Qualidade dos metadados
                          </span>
                          <div className="text-xs mt-12 flex flex-wrap items-center gap-8 text-neutral-700">
                            <div className="flex items-center gap-8" title="Visualizações">
                              <Icon
                                name="agora-solid-eye"
                                dimensions="xs"
                                className="fill-neutral-700"
                                aria-hidden="true"
                              />
                              <span>{formatMetricValue(dataset?.metrics?.views, 1, 0)}</span>
                            </div>
                            <div className="flex items-center gap-8" title="Downloads">
                              <Icon
                                name="agora-solid-download"
                                dimensions="xs"
                                className="fill-neutral-700"
                                aria-hidden="true"
                              />
                              <span>
                                {formatMetricValue(dataset?.metrics?.resources_downloads, 1, 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-8" title="Reutilizações">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                className="h-16 w-16 fill-neutral-700"
                                aria-hidden="true"
                              >
                                <path d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z" />
                              </svg>
                              <span>{dataset?.metrics?.reuses || 0}</span>
                            </div>
                            <div className="flex items-center gap-8" title="Favoritos">
                              <Icon
                                name="agora-solid-star"
                                dimensions="xs"
                                className="fill-neutral-700"
                                aria-hidden="true"
                              />
                              <span>{formatMetricValue(dataset?.metrics?.followers, 1, 0)}</span>
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
                  anchor={{ href: dataset?.slug ? `/pages/datasets/${dataset.slug}` : "#" }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDataset(index)}
                className="rounded group absolute right-[8px] top-[8px] z-10 p-[4px]"
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

        {data.datasetIds.length < 6 && !showSearch && (
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="flex min-h-[200px] flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-neutral-300 text-neutral-900 transition-colors hover:border-neutral-400"
          >
            <Icon name="agora-line-plus-circle" className="mb-[4px] h-[20px] w-[20px]" />
            <span className="text-xs">Adicionar um conjunto de dados</span>
          </button>
        )}

        {showSearch && (
          <div ref={searchContainerRef} className="relative mt-[8px] w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar conjunto de dados..."
              className="text-sm w-full rounded-[8px] border border-neutral-300 px-[12px] py-[10px] outline-none focus:border-primary-500"
              autoFocus
            />
            {isSearching && <p className="text-xs mt-[4px] text-neutral-400">A pesquisar...</p>}
            {searchResults.length > 0 && (
              <ul className="shadow-lg absolute z-10 mt-[4px] max-h-[240px] w-full overflow-y-auto rounded-[8px] border border-neutral-200 bg-white">
                {searchResults.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectDataset(d)}
                      className="text-sm w-full px-[12px] py-[8px] text-left transition-colors hover:bg-neutral-50"
                    >
                      <span className="font-medium text-neutral-800">{d.title}</span>
                      {d.organization?.name && (
                        <span className="ml-[8px] text-neutral-400">— {d.organization.name}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <p className="text-xs mt-[4px] text-neutral-400">Nenhum resultado encontrado</p>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="text-xs mt-[4px] text-neutral-400 hover:text-neutral-600"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedReusesEditor({
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
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchReuses(searchQuery, 1, 8);
        setSearchResults(response.data.filter((r) => !data.reuseIds.includes(r.id)));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
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
    <div className="rounded-[8px] bg-white py-[24px]">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="As minhas reutilizações"
        className="text-xl mb-[4px] w-full border-none font-bold text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />
      <input
        type="text"
        value={data.legend}
        onChange={(e) => onChange({ ...data, legend: e.target.value })}
        placeholder="Adicionar legenda"
        className="text-sm mb-[20px] w-full border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />

      <div className="grid grid-cols-3 gap-[16px]">
        {data.reuseIds.map((id, index) => {
          const reuse = nameMap?.[id];
          const formatMetric = (value: number | undefined) => {
            if (!value) return "0";
            if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
            if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
            return String(value);
          };
          const timeAgo = reuse?.last_modified
            ? formatDistanceToNow(new Date(reuse.last_modified), {
                locale: pt,
                addSuffix: false,
              })
                .replace("menos de ", "")
                .replace("cerca de ", "")
            : "Desconhecido";

          return (
            <div key={id} className="relative">
              <div className="card-general-listing flex h-full flex-col overflow-hidden rounded-[4px]">
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
                  anchor={{ href: reuse?.slug ? `/pages/reuses/${reuse.slug}` : "#" }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveReuse(index)}
                className="rounded group absolute right-[8px] top-[8px] z-10 p-[4px]"
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
            className="flex min-h-[200px] flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-neutral-300 text-neutral-900 transition-colors hover:border-neutral-400"
          >
            <Icon name="agora-line-plus-circle" className="mb-[4px] h-[20px] w-[20px]" />
            <span className="text-xs">Adicione uma reutilização</span>
          </button>
        )}

        {showSearch && (
          <div ref={searchContainerRef} className="relative mt-[8px] w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar reutilização..."
              className="text-sm w-full rounded-[8px] border border-neutral-300 px-[12px] py-[10px] outline-none focus:border-primary-500"
              autoFocus
            />
            {isSearching && <p className="text-xs mt-[4px] text-neutral-400">A pesquisar...</p>}
            {searchResults.length > 0 && (
              <ul className="shadow-lg absolute z-10 mt-[4px] max-h-[240px] w-full overflow-y-auto rounded-[8px] border border-neutral-200 bg-white">
                {searchResults.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectReuse(r)}
                      className="text-sm w-full px-[12px] py-[8px] text-left transition-colors hover:bg-neutral-50"
                    >
                      <span className="font-medium text-neutral-800">{r.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <p className="text-xs mt-[4px] text-neutral-400">Nenhum resultado encontrado</p>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="text-xs mt-[4px] text-neutral-400 hover:text-neutral-600"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedLinksEditor({
  data,
  onChange,
}: {
  data: FeaturedLinksData;
  onChange: (d: FeaturedLinksData) => void;
}) {
  const addParagraph = () => {
    onChange({ ...data, paragraphs: [...data.paragraphs, ""] });
  };

  const addLink = () => {
    if (data.links.length >= 4) return;
    onChange({ ...data, links: [...data.links, { label: "", url: "" }] });
  };

  return (
    <div className="rounded-[8px] bg-white py-[24px]">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Os meus links"
        className="text-xl mb-[4px] w-full border-none font-bold text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />
      <input
        type="text"
        value={data.legend}
        onChange={(e) => onChange({ ...data, legend: e.target.value })}
        placeholder="Adicionar legenda"
        className="text-sm mb-[20px] w-full border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />

      <div className="flex gap-[32px]">
        {/* Left column: paragraphs + button */}
        <div className="flex flex-1 flex-col gap-[12px]">
          {data.paragraphs.map((text, index) => (
            <div key={index} className="flex items-start gap-[8px]">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    paragraphs: data.paragraphs.filter((_, i) => i !== index),
                  })
                }
                className="rounded hover:bg-red-100 hover:text-red-600 mt-[2px] p-[4px] text-neutral-400"
              >
                <Icon name="agora-line-trash" className="h-[14px] w-[14px]" />
              </button>
              <input
                type="text"
                value={text}
                onChange={(e) => {
                  const paragraphs = [...data.paragraphs];
                  paragraphs[index] = e.target.value;
                  onChange({ ...data, paragraphs });
                }}
                placeholder="Texto do parágrafo"
                className="text-sm flex-1 border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addParagraph}
            className="text-xs inline-flex items-center gap-[4px] font-medium text-neutral-400 hover:text-neutral-600"
          >
            <Icon name="agora-line-plus-circle" className="h-[14px] w-[14px]" />
            Adicione um parágrafo
          </button>

          <button
            type="button"
            onClick={addLink}
            className="text-xs inline-flex items-center gap-[4px] font-medium text-neutral-400 hover:text-neutral-600"
          >
            <Icon name="agora-line-plus-circle" className="h-[14px] w-[14px]" />
            Adicionar um link
          </button>

          <div className="mt-[8px]">
            <span className="text-sm inline-block rounded-[6px] bg-primary-900 px-[16px] py-[8px] font-medium text-white">
              <input
                type="text"
                value={data.buttonLabel}
                onChange={(e) => onChange({ ...data, buttonLabel: e.target.value })}
                placeholder="Título do botão"
                className="border-none bg-transparent text-white placeholder-white/60 outline-none"
              />
            </span>
            <div className="mt-[4px]">
              <input
                type="text"
                value={data.buttonUrl}
                onChange={(e) => onChange({ ...data, buttonUrl: e.target.value })}
                placeholder="URL do botão"
                className="text-sm border-orange-400 w-[250px] max-w-full rounded-[6px] border px-[12px] py-[6px] placeholder-neutral-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right column: links list */}
        {data.links.length > 0 && (
          <div className="flex flex-1 flex-col gap-[16px]">
            {data.links.map((link, index) => (
              <div key={index} className="flex items-start gap-[6px]">
                <span className="mt-[4px] text-primary-900">&#8226;</span>
                <div className="flex-1">
                  <div className="flex items-center gap-[4px]">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => {
                        const links = [...data.links];
                        links[index] = { ...links[index], label: e.target.value };
                        onChange({ ...data, links });
                      }}
                      placeholder="Título do link"
                      className="text-lg border-none font-bold text-primary-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
                    />
                    <Icon
                      name="agora-line-external-link"
                      className="h-[16px] w-[16px] text-primary-900"
                    />
                  </div>
                  <div className="mt-[2px] flex items-center gap-[4px]">
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...data,
                          links: data.links.filter((_, i) => i !== index),
                        })
                      }
                      className="rounded hover:bg-red-100 hover:text-red-600 p-[2px] text-neutral-400"
                    >
                      <Icon name="agora-line-trash" className="h-[14px] w-[14px]" />
                    </button>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => {
                        const links = [...data.links];
                        links[index] = { ...links[index], url: e.target.value };
                        onChange({ ...data, links });
                      }}
                      placeholder="URL"
                      className="text-sm rounded-[4px] border border-neutral-300 px-[8px] py-[4px] text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
                    />
                  </div>
                </div>
              </div>
            ))}

            {data.links.length < 4 && (
              <button
                type="button"
                onClick={addLink}
                className="text-xs inline-flex items-center gap-[4px] font-medium text-neutral-400 hover:text-neutral-600"
              >
                <Icon name="agora-line-plus-circle" className="h-[14px] w-[14px]" />
                Adicionar um link
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MarkdownEditor({
  data,
  onChange,
}: {
  data: MarkdownData;
  onChange: (d: MarkdownData) => void;
}) {
  return (
    <div className="rounded-[8px] bg-white py-[24px]">
      <div className="overflow-hidden rounded-[8px] border border-neutral-200">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-[2px] border-b border-neutral-200 bg-neutral-50 px-[12px] py-[8px]">
          {[
            { icon: "agora-line-refresh", title: "Desfazer" },
            { icon: "agora-line-refresh", title: "Refazer" },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              title={btn.title}
              className="rounded p-[6px] text-neutral-600 hover:bg-neutral-200"
            >
              <Icon name={btn.icon} className="h-[16px] w-[16px]" />
            </button>
          ))}
          <span className="mx-[4px] h-[20px] w-[1px] bg-neutral-300" />
          {["B", "I"].map((label) => (
            <button
              key={label}
              type="button"
              title={label === "B" ? "Negrito" : "Itálico"}
              className="rounded text-sm w-[28px] p-[6px] text-center font-bold text-neutral-600 hover:bg-neutral-200"
            >
              {label}
            </button>
          ))}
          {["H2", "H3", "H4"].map((label) => (
            <button
              key={label}
              type="button"
              title={`Cabeçalho ${label}`}
              className="rounded text-xs w-[28px] p-[6px] text-center font-medium text-neutral-500 hover:bg-neutral-200"
            >
              {label}
            </button>
          ))}
          <span className="mx-[4px] h-[20px] w-[1px] bg-neutral-300" />
          {[
            { icon: "agora-line-layers-menu", title: "Tabela" },
            { icon: "agora-line-external-link", title: "Link" },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              title={btn.title}
              className="rounded p-[6px] text-neutral-600 hover:bg-neutral-200"
            >
              <Icon name={btn.icon} className="h-[16px] w-[16px]" />
            </button>
          ))}
          <span className="mx-[4px] h-[20px] w-[1px] bg-neutral-300" />
          {[
            { icon: "agora-line-layers-menu", title: "Lista" },
            { icon: "agora-line-layers-menu", title: "Lista ordenada" },
            { icon: "agora-line-code", title: "Código" },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              title={btn.title}
              className="rounded p-[6px] text-neutral-600 hover:bg-neutral-200"
            >
              <Icon name={btn.icon} className="h-[16px] w-[16px]" />
            </button>
          ))}
        </div>

        {/* Editor area */}
        <textarea
          value={data.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Escreva aqui o conteúdo..."
          rows={8}
          className="text-sm w-full resize-y border-none px-[16px] py-[12px] text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
        />

        <div className="h-[3px] bg-primary-500" />
      </div>
    </div>
  );
}

// ─── Block Editor router ─────────────────────────────────────────────────────

function BlockEditor({
  block,
  onUpdate,
  datasetNameMap,
  reuseNameMap,
  onDatasetNameMapUpdate,
  onReuseNameMapUpdate,
}: {
  block: ContentBlock;
  onUpdate: (data: BlockData) => void;
  datasetNameMap?: Record<string, Dataset>;
  reuseNameMap?: Record<string, Reuse>;
  onDatasetNameMapUpdate?: (dataset: Dataset) => void;
  onReuseNameMapUpdate?: (reuse: Reuse) => void;
}) {
  switch (block.type) {
    case "hero":
      return <HeroEditor data={block.data as HeroData} onChange={onUpdate} />;
    case "accordion":
      return <AccordionEditor data={block.data as AccordionData} onChange={onUpdate} />;
    case "featured-datasets":
      return (
        <FeaturedDatasetsEditor
          data={block.data as FeaturedDatasetsData}
          onChange={onUpdate}
          nameMap={datasetNameMap}
          onNameMapUpdate={onDatasetNameMapUpdate}
        />
      );
    case "featured-reuses":
      return (
        <FeaturedReusesEditor
          data={block.data as FeaturedReusesData}
          onChange={onUpdate}
          nameMap={reuseNameMap}
          onNameMapUpdate={onReuseNameMapUpdate}
        />
      );
    case "featured-links":
      return <FeaturedLinksEditor data={block.data as FeaturedLinksData} onChange={onUpdate} />;
    case "markdown":
      return <MarkdownEditor data={block.data as MarkdownData} onChange={onUpdate} />;
    default:
      return null;
  }
}

// ─── Delete block confirmation popup ─────────────────────────────────────────

function DeleteBlockPopupContent({
  onClose,
  onConfirm,
  message = "Essa ação é irreversível. Tem a certeza que quer eliminar este bloco?",
}: {
  onClose: () => void;
  onConfirm: () => void;
  message?: string;
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <p>{message}</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

// ─── Block wrapper with side controls ────────────────────────────────────────

function BlockWrapper({
  block,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdate,
  datasetNameMap,
  reuseNameMap,
  onDatasetNameMapUpdate,
  onReuseNameMapUpdate,
}: {
  block: ContentBlock;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (data: BlockData) => void;
  datasetNameMap?: Record<string, Dataset>;
  reuseNameMap?: Record<string, Reuse>;
  onDatasetNameMapUpdate?: (dataset: Dataset) => void;
  onReuseNameMapUpdate?: (reuse: Reuse) => void;
}) {
  const { show, hide } = usePopupContext();

  const handleRemove = () => {
    show(
      <DeleteBlockPopupContent
        onClose={hide}
        onConfirm={() => {
          hide();
          onRemove();
        }}
      />,
      {
        title: "Elimine o bloco",
        closeAriaLabel: "Fechar",
        dimensions: "m",
      }
    );
  };

  return (
    <div className="flex gap-[8px]">
      <div className="flex flex-col items-center gap-[8px] pt-[24px]">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="rounded p-[4px] text-neutral-500 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-30"
          title="Mover para cima"
        >
          <Icon name="agora-line-chevron-up" className="h-[16px] w-[16px]" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="rounded p-[4px] text-neutral-500 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-30"
          title="Mover para baixo"
        >
          <Icon name="agora-line-chevron-down" className="h-[16px] w-[16px]" />
        </button>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded group p-[4px]"
          title="Remover bloco"
        >
          <Icon
            name="agora-line-trash"
            className="block h-[16px] w-[16px] !fill-[var(--color-danger-600)] group-hover:hidden"
          />
          <Icon
            name="agora-solid-trash"
            className="hidden h-[16px] w-[16px] !fill-[var(--color-danger-600)] group-hover:block"
          />
        </button>
      </div>

      <div className="flex-1">
        <BlockEditor
          block={block}
          onUpdate={onUpdate}
          datasetNameMap={datasetNameMap}
          reuseNameMap={reuseNameMap}
          onDatasetNameMapUpdate={onDatasetNameMapUpdate}
          onReuseNameMapUpdate={onReuseNameMapUpdate}
        />
      </div>
    </div>
  );
}

// ─── Block list for a tab ────────────────────────────────────────────────────

function BlockList({
  blocks,
  setBlocks,
  setHasChanges,
  datasetNameMap,
  reuseNameMap,
  onDatasetNameMapUpdate,
  onReuseNameMapUpdate,
}: {
  blocks: ContentBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<ContentBlock[]>>;
  setHasChanges: (v: boolean) => void;
  datasetNameMap?: Record<string, Dataset>;
  reuseNameMap?: Record<string, Reuse>;
  onDatasetNameMapUpdate?: (dataset: Dataset) => void;
  onReuseNameMapUpdate?: (reuse: Reuse) => void;
}) {
  const addBlock = (type: BlockType, atIndex?: number) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      data: getDefaultData(type),
    };
    setBlocks((prev) => {
      if (atIndex !== undefined) {
        const next = [...prev];
        next.splice(atIndex, 0, newBlock);
        return next;
      }
      return [...prev, newBlock];
    });
    setHasChanges(true);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setHasChanges(true);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setHasChanges(true);
  };

  const updateBlock = (id: string, data: BlockData) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data } : b)));
    setHasChanges(true);
  };

  if (blocks.length === 0) {
    return (
      <div className="flex justify-center py-[32px]">
        <BlockPicker onSelect={(type) => addBlock(type)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {blocks.map((block, index) => (
        <div key={block.id}>
          <div className="flex justify-center py-[8px]">
            <BlockPicker onSelect={(type) => addBlock(type, index)} />
          </div>

          <BlockWrapper
            block={block}
            index={index}
            total={blocks.length}
            onRemove={() => removeBlock(block.id)}
            onMoveUp={() => moveBlock(index, "up")}
            onMoveDown={() => moveBlock(index, "down")}
            onUpdate={(data) => updateBlock(block.id, data)}
            datasetNameMap={datasetNameMap}
            reuseNameMap={reuseNameMap}
            onDatasetNameMapUpdate={onDatasetNameMapUpdate}
            onReuseNameMapUpdate={onReuseNameMapUpdate}
          />

          {index === blocks.length - 1 && (
            <div className="flex justify-center py-[8px]">
              <BlockPicker onSelect={(type) => addBlock(type, index + 1)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function SystemEditorialClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [datasetBlocks, setDatasetBlocks] = useState<ContentBlock[]>([]);
  const [reuseBlocks, setReuseBlocks] = useState<ContentBlock[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [datasetNameMap, setDatasetNameMap] = useState<Record<string, Dataset>>({});
  const [reuseNameMap, setReuseNameMap] = useState<Record<string, Reuse>>({});
  const initialDatasetsRef = useRef<Dataset[]>([]);
  const initialReusesRef = useRef<Reuse[]>([]);

  useEffect(() => {
    async function loadFeatured() {
      setIsLoading(true);
      try {
        const [datasets, reuses] = await Promise.all([
          fetchHomeFeaturedDatasets(),
          fetchHomeFeaturedReuses(),
        ]);
        initialDatasetsRef.current = datasets;
        initialReusesRef.current = reuses;

        const dsMap: Record<string, Dataset> = {};
        datasets.forEach((d) => {
          dsMap[d.id] = d;
        });
        setDatasetNameMap(dsMap);

        const rMap: Record<string, Reuse> = {};
        reuses.forEach((r) => {
          rMap[r.id] = r;
        });
        setReuseNameMap(rMap);

        if (datasets.length > 0) {
          setDatasetBlocks([
            {
              id: crypto.randomUUID(),
              type: "featured-datasets",
              data: {
                title: "",
                legend: "",
                datasetIds: datasets.map((d) => d.id),
              } as FeaturedDatasetsData,
            },
          ]);
        }
        if (reuses.length > 0) {
          setReuseBlocks([
            {
              id: crypto.randomUUID(),
              type: "featured-reuses",
              data: {
                title: "",
                legend: "",
                reuseIds: reuses.map((r) => r.id),
              } as FeaturedReusesData,
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading featured content:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadFeatured();
  }, []);

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  const handleSave = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsSaving(true);
    try {
      const datasetIds = datasetBlocks
        .filter((b) => b.type === "featured-datasets")
        .flatMap((b) => (b.data as FeaturedDatasetsData).datasetIds);
      const reuseIds = reuseBlocks
        .filter((b) => b.type === "featured-reuses")
        .flatMap((b) => (b.data as FeaturedReusesData).reuseIds);
      await Promise.all([
        updateHomeFeaturedDatasets(datasetIds),
        updateHomeFeaturedReuses(reuseIds),
      ]);
      setHasChanges(false);
      setSaveMessage({ type: "success", text: "Alterações guardadas." });
    } catch (error) {
      console.error("Error saving:", error);
      setSaveMessage({ type: "error", text: "Erro ao guardar alterações." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const datasets = initialDatasetsRef.current;
    const reuses = initialReusesRef.current;
    setDatasetBlocks(
      datasets.length > 0
        ? [
            {
              id: crypto.randomUUID(),
              type: "featured-datasets" as const,
              data: {
                title: "",
                legend: "",
                datasetIds: datasets.map((d) => d.id),
              } as FeaturedDatasetsData,
            },
          ]
        : []
    );
    setReuseBlocks(
      reuses.length > 0
        ? [
            {
              id: crypto.randomUUID(),
              type: "featured-reuses" as const,
              data: {
                title: "",
                legend: "",
                reuseIds: reuses.map((r) => r.id),
              } as FeaturedReusesData,
            },
          ]
        : []
    );
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="admin-page__breadcrumb">
          <Breadcrumb
            items={[
              { label: "Administração", url: "/pages/admin" },
              { label: "Editorial", url: "/pages/admin/system/editorial" },
            ]}
          />
        </div>
        <div className="mb-[24px] flex items-center justify-between">
          <h1 className="admin-page__title">Editorial</h1>
          <div className="flex items-center gap-[8px]">
            <Button
              appearance="outline"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-eye"
              leadingIconHover="agora-solid-eye"
              disabled
            >
              Veja a página pública
            </Button>
            <Button
              variant="primary"
              hasIcon
              leadingIcon="agora-line-edit"
              leadingIconHover="agora-solid-edit"
              disabled
            >
              Editar na página pública
            </Button>
          </div>
        </div>
        <p className="text-neutral-500">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Editorial", url: "/pages/admin/system/editorial" },
          ]}
        />
      </div>

      <div className="mb-[24px] flex items-center justify-between">
        <h1 className="admin-page__title">Editorial</h1>
        <div className="flex items-center gap-[8px]">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button
              appearance="outline"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-eye"
              leadingIconHover="agora-solid-eye"
            >
              Veja a página pública
            </Button>
          </a>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button
              variant="primary"
              hasIcon
              leadingIcon="agora-line-edit"
              leadingIconHover="agora-solid-edit"
            >
              Editar na página pública
            </Button>
          </a>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`text-sm mb-[16px] rounded-[8px] p-[12px] ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-700 border-green-200 border"
              : "bg-red-50 text-red-700 border-red-200 border"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <Tabs>
        <Tab active>
          <TabHeader>Conjuntos de dados</TabHeader>
          <TabBody>
            <div className="py-[24px]">
              <BlockList
                blocks={datasetBlocks}
                setBlocks={setDatasetBlocks}
                setHasChanges={setHasChanges}
                datasetNameMap={datasetNameMap}
                onDatasetNameMapUpdate={(dataset) =>
                  setDatasetNameMap((prev) => ({ ...prev, [dataset.id]: dataset }))
                }
              />
              {datasetBlocks.length > 0 && (
                <div className="mt-[16px] flex justify-end gap-[8px] pt-[16px]">
                  <Button appearance="outline" variant="primary" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    hasIcon
                    leadingIcon="agora-line-check-circle"
                    leadingIconHover="agora-solid-check-circle"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>
          </TabBody>
        </Tab>
        <Tab>
          <TabHeader>Reutilizar</TabHeader>
          <TabBody>
            <div className="py-[24px]">
              <BlockList
                blocks={reuseBlocks}
                setBlocks={setReuseBlocks}
                setHasChanges={setHasChanges}
                reuseNameMap={reuseNameMap}
                onReuseNameMapUpdate={(reuse) =>
                  setReuseNameMap((prev) => ({ ...prev, [reuse.id]: reuse }))
                }
              />
              {reuseBlocks.length > 0 && (
                <div className="mt-[16px] flex justify-end gap-[8px] pt-[16px]">
                  <Button appearance="outline" variant="primary" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    hasIcon
                    leadingIcon="agora-line-check-circle"
                    leadingIconHover="agora-solid-check-circle"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </div>
  );
}
