import type { UserGuideTheme } from "@/service/types/user-guides";
import { slugify } from "@/utils/slugify";

/**
 * Keeps the guides whose title or card description match the search term (case- and
 * accent-insensitive, via `slugify`), and drops the themes left without guides.
 */
export function filterUserGuideThemes(themes: UserGuideTheme[], query: string): UserGuideTheme[] {
  const term = slugify(query);
  if (!term) return themes;

  return themes
    .map((theme) => ({
      ...theme,
      guides: theme.guides.filter((guide) =>
        slugify(`${guide.title} ${guide.cardDescription}`).includes(term)
      ),
    }))
    .filter((theme) => theme.guides.length > 0);
}
