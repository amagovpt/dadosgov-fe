"use client";

import { useState, useEffect, useRef } from "react";
import {
  Breadcrumb,
  Button,
  Icon,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
} from "@ama-pt/agora-design-system";
import {
  fetchHomeFeaturedDatasets,
  updateHomeFeaturedDatasets,
  fetchHomeFeaturedReuses,
  updateHomeFeaturedReuses,
  searchDatasets,
  searchReuses,
} from "@/services/api";
import type { Dataset, Reuse } from "@/types/api";

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
    icon: "agora-line-layers-menu",
    category: "LAYOUT",
  },
  {
    type: "featured-datasets",
    label: "Dados em destaque",
    description: "Destaque até 4 conjuntos de dados",
    icon: "agora-line-folder",
    category: "CONTEÚDO EM DESTAQUE",
  },
  {
    type: "featured-reuses",
    label: "Reutilização em destaque",
    description: "Destaque até 4 reutilizações",
    icon: "agora-line-bar-chart",
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
        <div className="absolute left-1/2 -translate-x-1/2 z-20 mt-[4px] w-[320px] bg-white border border-neutral-200 rounded-[8px] shadow-lg">
          <ul role="menu">
            {Object.entries(categories).map(([category, blocks]) => (
              <li key={category}>
                <p className="px-[16px] pt-[12px] pb-[4px] text-xs font-bold text-neutral-500 uppercase tracking-wide">
                  {category}
                </p>
                <ul>
                  {blocks.map((block) => (
                    <li key={block.type}>
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full text-left px-[16px] py-[8px] hover:bg-neutral-50 transition-colors"
                        onClick={() => {
                          onSelect(block.type);
                          setIsOpen(false);
                        }}
                      >
                        <span className="flex items-center gap-[8px]">
                          <Icon
                            name={block.icon}
                            className="w-[18px] h-[18px] text-neutral-700"
                          />
                          <span className="text-sm font-semibold text-neutral-800">
                            {block.label}
                          </span>
                        </span>
                        <p className="text-xs text-neutral-500 mt-[2px] ml-[26px]">
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

function HeroEditor({
  data,
  onChange,
}: {
  data: HeroData;
  onChange: (d: HeroData) => void;
}) {
  const colorBg = HERO_COLORS.find((c) => c.value === data.color)?.bg ?? "bg-primary-900";

  return (
    <div className={`${colorBg} rounded-[8px] p-[32px] text-white`}>
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Título"
        className="w-full bg-transparent text-2xl font-bold placeholder-white/60 outline-none border-none mb-[8px]"
      />
      <input
        type="text"
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="Adicione uma descrição"
        className="w-full bg-transparent text-sm placeholder-white/60 outline-none border-none mb-[20px]"
      />
      <div className="mb-[8px]">
        <span className="inline-block px-[16px] py-[8px] text-sm font-medium text-primary-900 bg-white rounded-[6px] border border-white/30">
          <input
            type="text"
            value={data.buttonLabel}
            onChange={(e) => onChange({ ...data, buttonLabel: e.target.value })}
            placeholder="Título do botão"
            className="bg-transparent outline-none border-none placeholder-neutral-400 text-primary-900"
          />
        </span>
      </div>
      <input
        type="text"
        value={data.buttonUrl}
        onChange={(e) => onChange({ ...data, buttonUrl: e.target.value })}
        placeholder="URL do botão"
        className="w-[300px] max-w-full px-[12px] py-[6px] text-sm text-neutral-800 bg-white rounded-[6px] border border-orange-400 placeholder-neutral-400 outline-none mb-[16px]"
      />
      <div className="flex items-center gap-[8px]">
        <span className="text-sm">Cor :</span>
        {HERO_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange({ ...data, color: c.value })}
            className={`w-[28px] h-[28px] rounded-full border-2 ${
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
    <div className="bg-white rounded-[8px] py-[24px]">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Meu acordeão"
        className="w-full text-xl font-bold text-neutral-900 placeholder-neutral-900 outline-none border-none mb-[4px]"
      />
      <input
        type="text"
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="Adicione uma descrição"
        className="w-full text-sm text-neutral-400 placeholder-neutral-400 outline-none border-none mb-[20px]"
      />

      <div className="flex flex-col">
        {data.items.map((item, index) => (
          <div key={index} className="border-b border-neutral-200">
            <div className="flex items-center justify-between py-[12px]">
              <div className="flex items-center gap-[8px] flex-1">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  placeholder="Título do item"
                  className="flex-1 text-sm text-neutral-700 placeholder-neutral-400 outline-none border-none"
                />
              </div>
              <div className="flex items-center gap-[4px]">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-[4px] rounded hover:bg-red-100 text-red-600"
                >
                  <Icon name="agora-line-trash" className="w-[14px] h-[14px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="p-[4px] rounded hover:bg-neutral-100 text-neutral-500"
                >
                  <Icon
                    name={openIndex === index ? "agora-line-chevron-up" : "agora-line-chevron-down"}
                    className="w-[16px] h-[16px]"
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
                  className="w-full px-[12px] py-[8px] text-sm border border-neutral-200 rounded-[6px] outline-none resize-y"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-[12px] inline-flex items-center gap-[4px] text-xs text-primary-600 font-medium hover:text-primary-800"
      >
        <Icon name="agora-line-plus-circle" className="w-[14px] h-[14px]" />
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
  nameMap?: Record<string, string>;
  onNameMapUpdate?: (id: string, title: string) => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Dataset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSearch) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
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
        setSearchResults(
          response.data.filter((d) => !data.datasetIds.includes(d.id))
        );
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
    onNameMapUpdate?.(dataset.id, dataset.title);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="bg-white rounded-[8px] py-[24px]">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Meus conjuntos de dados"
        className="w-full text-xl font-bold text-neutral-900 placeholder-neutral-900 outline-none border-none mb-[4px]"
      />
      <input
        type="text"
        value={data.legend}
        onChange={(e) => onChange({ ...data, legend: e.target.value })}
        placeholder="Adicionar legenda"
        className="w-full text-sm text-orange-500 placeholder-orange-400 outline-none border-none mb-[20px]"
      />

      <div className="flex flex-wrap gap-[12px]">
        {data.datasetIds.map((id, index) => (
          <div
            key={id}
            className="flex items-center gap-[8px] px-[12px] py-[8px] border border-neutral-200 rounded-[8px] bg-neutral-50 text-sm"
          >
            <span className="text-neutral-600 truncate max-w-[200px]">
              {nameMap?.[id] || id}
            </span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...data,
                  datasetIds: data.datasetIds.filter((_, i) => i !== index),
                })
              }
              className="text-red-500 hover:text-red-700"
            >
              <Icon name="agora-line-close" className="w-[14px] h-[14px]" />
            </button>
          </div>
        ))}

        {data.datasetIds.length < 6 && !showSearch && (
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="flex flex-col items-center justify-center w-[200px] h-[100px] border-2 border-dashed border-neutral-300 rounded-[8px] text-neutral-400 hover:border-neutral-400 hover:text-neutral-500 transition-colors"
          >
            <Icon name="agora-line-plus-circle" className="w-[20px] h-[20px] mb-[4px]" />
            <span className="text-xs">Adicionar um conjunto de dados</span>
          </button>
        )}

        {showSearch && (
          <div ref={searchContainerRef} className="w-full mt-[8px] relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar conjunto de dados..."
              className="w-full px-[12px] py-[10px] border border-neutral-300 rounded-[8px] text-sm outline-none focus:border-primary-500"
              autoFocus
            />
            {isSearching && (
              <p className="text-xs text-neutral-400 mt-[4px]">A pesquisar...</p>
            )}
            {searchResults.length > 0 && (
              <ul className="absolute z-10 w-full mt-[4px] bg-white border border-neutral-200 rounded-[8px] shadow-lg max-h-[240px] overflow-y-auto">
                {searchResults.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectDataset(d)}
                      className="w-full text-left px-[12px] py-[8px] text-sm hover:bg-neutral-50 transition-colors"
                    >
                      <span className="font-medium text-neutral-800">
                        {d.title}
                      </span>
                      {d.organization?.name && (
                        <span className="text-neutral-400 ml-[8px]">
                          — {d.organization.name}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchQuery.length >= 2 &&
              !isSearching &&
              searchResults.length === 0 && (
                <p className="text-xs text-neutral-400 mt-[4px]">
                  Nenhum resultado encontrado
                </p>
              )}
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="mt-[4px] text-xs text-neutral-400 hover:text-neutral-600"
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
  nameMap?: Record<string, string>;
  onNameMapUpdate?: (id: string, title: string) => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Reuse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSearch) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
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
        setSearchResults(
          response.data.filter((r) => !data.reuseIds.includes(r.id))
        );
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
    onNameMapUpdate?.(reuse.id, reuse.title);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="bg-white rounded-[8px] py-[24px]">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Minhas reutilizações"
        className="w-full text-xl font-bold text-neutral-900 placeholder-neutral-900 outline-none border-none mb-[4px]"
      />
      <input
        type="text"
        value={data.legend}
        onChange={(e) => onChange({ ...data, legend: e.target.value })}
        placeholder="Adicionar legenda"
        className="w-full text-sm text-orange-500 placeholder-orange-400 outline-none border-none mb-[20px]"
      />

      <div className="flex flex-wrap gap-[12px]">
        {data.reuseIds.map((id, index) => (
          <div
            key={id}
            className="flex items-center gap-[8px] px-[12px] py-[8px] border border-neutral-200 rounded-[8px] bg-neutral-50 text-sm"
          >
            <span className="text-neutral-600 truncate max-w-[200px]">
              {nameMap?.[id] || id}
            </span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...data,
                  reuseIds: data.reuseIds.filter((_, i) => i !== index),
                })
              }
              className="text-red-500 hover:text-red-700"
            >
              <Icon name="agora-line-close" className="w-[14px] h-[14px]" />
            </button>
          </div>
        ))}

        {data.reuseIds.length < 6 && !showSearch && (
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="flex flex-col items-center justify-center w-[200px] h-[100px] border-2 border-dashed border-neutral-300 rounded-[8px] text-neutral-400 hover:border-neutral-400 hover:text-neutral-500 transition-colors"
          >
            <Icon name="agora-line-plus-circle" className="w-[20px] h-[20px] mb-[4px]" />
            <span className="text-xs">Adicione uma reutilização</span>
          </button>
        )}

        {showSearch && (
          <div ref={searchContainerRef} className="w-full mt-[8px] relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar reutilização..."
              className="w-full px-[12px] py-[10px] border border-neutral-300 rounded-[8px] text-sm outline-none focus:border-primary-500"
              autoFocus
            />
            {isSearching && (
              <p className="text-xs text-neutral-400 mt-[4px]">A pesquisar...</p>
            )}
            {searchResults.length > 0 && (
              <ul className="absolute z-10 w-full mt-[4px] bg-white border border-neutral-200 rounded-[8px] shadow-lg max-h-[240px] overflow-y-auto">
                {searchResults.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectReuse(r)}
                      className="w-full text-left px-[12px] py-[8px] text-sm hover:bg-neutral-50 transition-colors"
                    >
                      <span className="font-medium text-neutral-800">
                        {r.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchQuery.length >= 2 &&
              !isSearching &&
              searchResults.length === 0 && (
                <p className="text-xs text-neutral-400 mt-[4px]">
                  Nenhum resultado encontrado
                </p>
              )}
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="mt-[4px] text-xs text-neutral-400 hover:text-neutral-600"
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
    <div className="bg-white rounded-[8px] py-[24px]">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Meus links"
        className="w-full text-xl font-bold text-neutral-900 placeholder-neutral-900 outline-none border-none mb-[4px]"
      />
      <input
        type="text"
        value={data.legend}
        onChange={(e) => onChange({ ...data, legend: e.target.value })}
        placeholder="Adicionar legenda"
        className="w-full text-sm text-orange-500 placeholder-orange-400 outline-none border-none mb-[20px]"
      />

      <div className="flex gap-[32px]">
        {/* Left column: paragraphs + button */}
        <div className="flex-1 flex flex-col gap-[12px]">
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
                className="p-[4px] mt-[2px] rounded hover:bg-red-100 text-neutral-400 hover:text-red-600"
              >
                <Icon name="agora-line-trash" className="w-[14px] h-[14px]" />
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
                className="flex-1 text-sm text-neutral-700 placeholder-neutral-400 outline-none border-none"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addParagraph}
            className="inline-flex items-center gap-[4px] text-xs text-neutral-400 font-medium hover:text-neutral-600"
          >
            <Icon name="agora-line-plus-circle" className="w-[14px] h-[14px]" />
            Adicione um parágrafo
          </button>

          <button
            type="button"
            onClick={addLink}
            className="inline-flex items-center gap-[4px] text-xs text-neutral-400 font-medium hover:text-neutral-600"
          >
            <Icon name="agora-line-plus-circle" className="w-[14px] h-[14px]" />
            Adicionar um link
          </button>

          <div className="mt-[8px]">
            <span className="inline-block px-[16px] py-[8px] text-sm font-medium text-white bg-primary-900 rounded-[6px]">
              <input
                type="text"
                value={data.buttonLabel}
                onChange={(e) => onChange({ ...data, buttonLabel: e.target.value })}
                placeholder="Título do botão"
                className="bg-transparent outline-none border-none placeholder-white/60 text-white"
              />
            </span>
            <div className="mt-[4px]">
              <input
                type="text"
                value={data.buttonUrl}
                onChange={(e) => onChange({ ...data, buttonUrl: e.target.value })}
                placeholder="URL do botão"
                className="w-[250px] max-w-full px-[12px] py-[6px] text-sm border border-orange-400 rounded-[6px] outline-none placeholder-neutral-400"
              />
            </div>
          </div>
        </div>

        {/* Right column: links list */}
        {data.links.length > 0 && (
          <div className="flex-1 flex flex-col gap-[16px]">
            {data.links.map((link, index) => (
              <div key={index} className="flex items-start gap-[6px]">
                <span className="text-primary-900 mt-[4px]">&#8226;</span>
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
                      className="text-lg font-bold text-primary-900 placeholder-primary-900/40 outline-none border-none"
                    />
                    <Icon
                      name="agora-line-external-link"
                      className="w-[16px] h-[16px] text-primary-900"
                    />
                  </div>
                  <div className="flex items-center gap-[4px] mt-[2px]">
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...data,
                          links: data.links.filter((_, i) => i !== index),
                        })
                      }
                      className="p-[2px] rounded hover:bg-red-100 text-neutral-400 hover:text-red-600"
                    >
                      <Icon name="agora-line-trash" className="w-[14px] h-[14px]" />
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
                      className="text-sm text-neutral-600 placeholder-neutral-400 outline-none border border-neutral-300 rounded-[4px] px-[8px] py-[4px]"
                    />
                  </div>
                </div>
              </div>
            ))}

            {data.links.length < 4 && (
              <button
                type="button"
                onClick={addLink}
                className="inline-flex items-center gap-[4px] text-xs text-neutral-400 font-medium hover:text-neutral-600"
              >
                <Icon name="agora-line-plus-circle" className="w-[14px] h-[14px]" />
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
    <div className="bg-white rounded-[8px] py-[24px]">
      <div className="border border-neutral-200 rounded-[8px] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-[2px] px-[12px] py-[8px] bg-neutral-50 border-b border-neutral-200 flex-wrap">
          {[
            { icon: "agora-line-refresh", title: "Desfazer" },
            { icon: "agora-line-refresh", title: "Refazer" },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              title={btn.title}
              className="p-[6px] rounded hover:bg-neutral-200 text-neutral-600"
            >
              <Icon name={btn.icon} className="w-[16px] h-[16px]" />
            </button>
          ))}
          <span className="w-[1px] h-[20px] bg-neutral-300 mx-[4px]" />
          {["B", "I"].map((label) => (
            <button
              key={label}
              type="button"
              title={label === "B" ? "Negrito" : "Itálico"}
              className="p-[6px] rounded hover:bg-neutral-200 text-neutral-600 text-sm font-bold w-[28px] text-center"
            >
              {label}
            </button>
          ))}
          {["H2", "H3", "H4"].map((label) => (
            <button
              key={label}
              type="button"
              title={`Cabeçalho ${label}`}
              className="p-[6px] rounded hover:bg-neutral-200 text-neutral-500 text-xs font-medium w-[28px] text-center"
            >
              {label}
            </button>
          ))}
          <span className="w-[1px] h-[20px] bg-neutral-300 mx-[4px]" />
          {[
            { icon: "agora-line-layers-menu", title: "Tabela" },
            { icon: "agora-line-external-link", title: "Link" },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              title={btn.title}
              className="p-[6px] rounded hover:bg-neutral-200 text-neutral-600"
            >
              <Icon name={btn.icon} className="w-[16px] h-[16px]" />
            </button>
          ))}
          <span className="w-[1px] h-[20px] bg-neutral-300 mx-[4px]" />
          {[
            { icon: "agora-line-layers-menu", title: "Lista" },
            { icon: "agora-line-layers-menu", title: "Lista ordenada" },
            { icon: "agora-line-code", title: "Código" },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              title={btn.title}
              className="p-[6px] rounded hover:bg-neutral-200 text-neutral-600"
            >
              <Icon name={btn.icon} className="w-[16px] h-[16px]" />
            </button>
          ))}
        </div>

        {/* Editor area */}
        <textarea
          value={data.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Escreva aqui o conteúdo..."
          rows={8}
          className="w-full px-[16px] py-[12px] text-sm outline-none resize-y border-none"
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
  datasetNameMap?: Record<string, string>;
  reuseNameMap?: Record<string, string>;
  onDatasetNameMapUpdate?: (id: string, title: string) => void;
  onReuseNameMapUpdate?: (id: string, title: string) => void;
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
      return (
        <FeaturedLinksEditor data={block.data as FeaturedLinksData} onChange={onUpdate} />
      );
    case "markdown":
      return <MarkdownEditor data={block.data as MarkdownData} onChange={onUpdate} />;
    default:
      return null;
  }
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
  datasetNameMap?: Record<string, string>;
  reuseNameMap?: Record<string, string>;
  onDatasetNameMapUpdate?: (id: string, title: string) => void;
  onReuseNameMapUpdate?: (id: string, title: string) => void;
}) {
  return (
    <div className="flex gap-[8px]">
      <div className="flex flex-col items-center gap-[8px] pt-[24px]">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-[4px] rounded hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-500"
          title="Mover para cima"
        >
          <Icon name="agora-line-chevron-up" className="w-[16px] h-[16px]" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-[4px] rounded hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-500"
          title="Mover para baixo"
        >
          <Icon name="agora-line-chevron-down" className="w-[16px] h-[16px]" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-[4px] rounded hover:bg-red-100 text-neutral-400 hover:text-red-600"
          title="Remover bloco"
        >
          <Icon name="agora-line-trash" className="w-[16px] h-[16px]" />
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
  datasetNameMap?: Record<string, string>;
  reuseNameMap?: Record<string, string>;
  onDatasetNameMapUpdate?: (id: string, title: string) => void;
  onReuseNameMapUpdate?: (id: string, title: string) => void;
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
  const [datasetNameMap, setDatasetNameMap] = useState<Record<string, string>>({});
  const [reuseNameMap, setReuseNameMap] = useState<Record<string, string>>({});
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

        const dsMap: Record<string, string> = {};
        datasets.forEach((d) => { dsMap[d.id] = d.title; });
        setDatasetNameMap(dsMap);

        const rMap: Record<string, string> = {};
        reuses.forEach((r) => { rMap[r.id] = r.title; });
        setReuseNameMap(rMap);

        if (datasets.length > 0) {
          setDatasetBlocks([{
            id: crypto.randomUUID(),
            type: "featured-datasets",
            data: {
              title: "",
              legend: "",
              datasetIds: datasets.map((d) => d.id),
            } as FeaturedDatasetsData,
          }]);
        }
        if (reuses.length > 0) {
          setReuseBlocks([{
            id: crypto.randomUUID(),
            type: "featured-reuses",
            data: {
              title: "",
              legend: "",
              reuseIds: reuses.map((r) => r.id),
            } as FeaturedReusesData,
          }]);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        ? [{
            id: crypto.randomUUID(),
            type: "featured-datasets" as const,
            data: {
              title: "",
              legend: "",
              datasetIds: datasets.map((d) => d.id),
            } as FeaturedDatasetsData,
          }]
        : []
    );
    setReuseBlocks(
      reuses.length > 0
        ? [{
            id: crypto.randomUUID(),
            type: "featured-reuses" as const,
            data: {
              title: "",
              legend: "",
              reuseIds: reuses.map((r) => r.id),
            } as FeaturedReusesData,
          }]
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
        <div className="flex items-center justify-between mb-[24px]">
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

      <div className="flex items-center justify-between mb-[24px]">
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
          className={`mb-[16px] p-[12px] rounded-[8px] text-sm ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
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
                onDatasetNameMapUpdate={(id, title) =>
                  setDatasetNameMap((prev) => ({ ...prev, [id]: title }))
                }
              />
              {datasetBlocks.length > 0 && (
                <div className="flex justify-end gap-[8px] pt-[16px] mt-[16px]">
                  <Button
                    appearance="outline"
                    variant="primary"
                    onClick={handleCancel}
                  >
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
                onReuseNameMapUpdate={(id, title) =>
                  setReuseNameMap((prev) => ({ ...prev, [id]: title }))
                }
              />
              {reuseBlocks.length > 0 && (
                <div className="flex justify-end gap-[8px] pt-[16px] mt-[16px]">
                  <Button
                    appearance="outline"
                    variant="primary"
                    onClick={handleCancel}
                  >
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
