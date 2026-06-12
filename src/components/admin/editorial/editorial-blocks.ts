export type BlockType =
  | "hero"
  | "accordion"
  | "featured-datasets"
  | "featured-reuses"
  | "featured-links"
  | "markdown";

export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  iconImg?: string;
  category: string;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
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

export interface HeroData {
  title: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  color: "blue" | "green" | "red";
}

export interface AccordionItemData {
  title: string;
  content: string;
}

export interface AccordionData {
  title: string;
  description: string;
  items: AccordionItemData[];
}

export interface FeaturedDatasetsData {
  title: string;
  legend: string;
  datasetIds: string[];
}

export interface FeaturedReusesData {
  title: string;
  legend: string;
  reuseIds: string[];
}

export interface FeaturedLinkItem {
  label: string;
  url: string;
}

export interface FeaturedLinksData {
  title: string;
  legend: string;
  paragraphs: string[];
  links: FeaturedLinkItem[];
  buttonLabel: string;
  buttonUrl: string;
}

export interface MarkdownData {
  content: string;
}

export type BlockData =
  | HeroData
  | AccordionData
  | FeaturedDatasetsData
  | FeaturedReusesData
  | FeaturedLinksData
  | MarkdownData;

export interface ContentBlock {
  id: string;
  type: BlockType;
  data: BlockData;
}

export const HERO_COLORS: { value: HeroData["color"]; bg: string; ring: string }[] = [
  { value: "blue", bg: "bg-primary-900", ring: "ring-white" },
  { value: "green", bg: "bg-green-800", ring: "ring-white" },
  { value: "red", bg: "bg-red-800", ring: "ring-white" },
];

export function getDefaultData(type: BlockType): BlockData {
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
