import type { GlossaryEntry, GlossaryGroup } from "@/service/types/glossary";

/** Uppercase without diacritics, so "Área" files under "A" and matches "area". */
export function normalizeGlossaryTerm(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
}

/** Groups entries by the first letter of the word, letters and words sorted A–Z. */
export function groupByFirstLetter(entries: GlossaryEntry[]): GlossaryGroup[] {
  const groups = new Map<string, GlossaryEntry[]>();

  for (const entry of entries) {
    const letter = normalizeGlossaryTerm(entry.word.trim().charAt(0));
    if (!letter) continue;
    groups.set(letter, [...(groups.get(letter) ?? []), entry]);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({
      letter,
      items: [...items].sort((a, b) =>
        normalizeGlossaryTerm(a.word).localeCompare(normalizeGlossaryTerm(b.word))
      ),
    }));
}

/** Keeps the entries whose word contains `query` (case and accent insensitive). */
export function filterGlossary(entries: GlossaryEntry[], query: string): GlossaryEntry[] {
  const term = normalizeGlossaryTerm(query.trim());
  if (!term) return entries;
  return entries.filter((entry) => normalizeGlossaryTerm(entry.word).includes(term));
}

export const GLOSSARY_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const GLOSSARY_PAGE_SIZE = 16;

/**
 * Slices the sorted groups into pages of `pageSize` entries, keeping the letter grouping.
 * A letter whose entries cross a page boundary is repeated on each page it appears in.
 */
export function paginateGroups(
  groups: GlossaryGroup[],
  pageSize: number = GLOSSARY_PAGE_SIZE
): GlossaryGroup[][] {
  const flat = groups.flatMap((group) => group.items.map((item) => ({ letter: group.letter, item })));
  const pages: GlossaryGroup[][] = [];

  for (let start = 0; start < flat.length; start += pageSize) {
    const pageGroups: GlossaryGroup[] = [];
    for (const { letter, item } of flat.slice(start, start + pageSize)) {
      const last = pageGroups[pageGroups.length - 1];
      if (last && last.letter === letter) last.items.push(item);
      else pageGroups.push({ letter, items: [item] });
    }
    pages.push(pageGroups);
  }

  return pages;
}
