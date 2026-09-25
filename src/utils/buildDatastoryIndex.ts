import { DatastorySection, IndexAnchor } from "@/service/types/datastories/datastory";

/**
 * Builds the hero index from the datastory's own sections, so it always matches what the page renders.
 * Sections flagged `active: false` are skipped, the same rule DatastorySections applies.
 */
export function buildDatastoryIndex(sections: DatastorySection[] | undefined): IndexAnchor[] {
  return (sections ?? [])
    .filter((section) => section?.active !== false)
    .map((section) => ({
      children: section.title ?? "",
      href: `#${section.id}`,
    }));
}
