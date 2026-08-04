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

type TranslateFn = (key: string) => string;

export function getBlockDefinitions(t: TranslateFn): BlockDefinition[] {
  return [
    {
      type: "hero",
      label: t("blockPicker.blocks.hero.label"),
      description: t("blockPicker.blocks.hero.description"),
      icon: "agora-line-home",
      category: t("blockPicker.categories.layout"),
    },
    {
      type: "accordion",
      label: t("blockPicker.blocks.accordion.label"),
      description: t("blockPicker.blocks.accordion.description"),
      icon: "agora-line-folder",
      category: t("blockPicker.categories.layout"),
    },
    {
      type: "featured-datasets",
      label: t("blockPicker.blocks.featuredDatasets.label"),
      description: t("blockPicker.blocks.featuredDatasets.description"),
      icon: "agora-line-layers-menu",
      category: t("blockPicker.categories.featuredContent"),
    },
    {
      type: "featured-reuses",
      label: t("blockPicker.blocks.featuredReuses.label"),
      description: t("blockPicker.blocks.featuredReuses.description"),
      icon: "agora-line-bar-chart",
      iconImg: "/Icons/bar_chart_primary.svg",
      category: t("blockPicker.categories.featuredContent"),
    },
    {
      type: "featured-links",
      label: t("blockPicker.blocks.featuredLinks.label"),
      description: t("blockPicker.blocks.featuredLinks.description"),
      icon: "agora-line-external-link",
      category: t("blockPicker.categories.featuredContent"),
    },
    {
      type: "markdown",
      label: t("blockPicker.blocks.markdown.label"),
      description: t("blockPicker.blocks.markdown.description"),
      icon: "agora-line-document",
      category: t("blockPicker.categories.text"),
    },
  ];
}

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
