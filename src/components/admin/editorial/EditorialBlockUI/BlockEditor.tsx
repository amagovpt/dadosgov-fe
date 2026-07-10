import type { Dataset } from "@/service/types/dataset";
import type { Reuse } from "@/service/types/reuse";
import type {
  AccordionData,
  BlockData,
  ContentBlock,
  FeaturedDatasetsData,
  FeaturedLinksData,
  FeaturedReusesData,
  HeroData,
  MarkdownData,
} from "../editorial-blocks";
import { AccordionEditor } from "./AccordionEditor";
import { FeaturedDatasetsEditor } from "./FeaturedDatasetsEditor";
import { FeaturedLinksEditor } from "./FeaturedLinksEditor";
import { FeaturedReusesEditor } from "./FeaturedReusesEditor";
import { HeroEditor } from "./HeroEditor";
import { MarkdownEditor } from "./MarkdownEditor";

export function BlockEditor({
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
