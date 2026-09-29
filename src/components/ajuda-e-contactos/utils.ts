import type {
  AnchoredFaqCategory,
  FaqAnchorSource,
  FaqCategory,
} from "@/service/types/support";
import { slugify as slugifyAnchor } from "@/utils/slugify";

export const SUPPORT_ANCHORS = {
  currentPage: "nesta-pagina",
  help: "ajuda",
} as const;

/**
 * Set of IDs in PT for FAQs in /ajuda-e-contactos
 */
export function anchorFaqSections(
  sections: FaqCategory[],
  ptSources: FaqAnchorSource[] = []
): AnchoredFaqCategory[] {
  const ids = sections.map((section, idx) => ptSources[idx]?.id || section.id);
  const used = new Set(ids);
  return sections.map((section, idx) => ({
    ...section,
    id: ids[idx],
    items: section.items.map((item, itemIdx) => {
      const ptTitle = ptSources[idx]?.items?.[itemIdx];
      const title = (typeof ptTitle === "string" && ptTitle) || item.title;
      const base = slugifyAnchor(title) || "faq";
      let anchor = base;
      for (let n = 2; used.has(anchor); n++) anchor = `${base}-${n}`;
      used.add(anchor);
      return { ...item, anchor };
    }),
  }));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export function shouldPreselectFeedbackFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("toggle") === "feedback";
}

export function composeMessage(
  description: string,
  category: string,
  toggle: string,
  problemUrl: string,
  problemDateTime: string
): string {
  const lines: string[] = [];
  if (category) lines.push(`Categoria: ${category}`);
  if (toggle === "bug") {
    if (problemUrl.trim()) lines.push(`Página/URL: ${problemUrl.trim()}`);
    if (problemDateTime.trim()) lines.push(`Data/hora aproximada: ${problemDateTime.trim()}`);
  }
  const header = lines.join("\n");
  return header ? `${header}\n\n${description.trim()}` : description.trim();
}
