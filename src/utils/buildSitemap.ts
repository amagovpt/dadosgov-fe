import { isEnabled } from "@/config/headerNav";
import type {
  HeaderNavigationData,
  HeaderNavCard,
  HeaderNavGroup,
} from "@/service/types/header";

export interface SitemapNode {
  id: string;
  label: string;
  /** ausente em nós puramente de secção / que só abrem submenu (href === "#") */
  href?: string;
  external?: boolean;
  children?: SitemapNode[];
}

function cardToNode(
  card: HeaderNavCard,
  submenus: HeaderNavGroup[],
  isAuthenticated: boolean
): SitemapNode {
  const submenu = card.opensSubmenu
    ? submenus.find((s) => s.id === card.opensSubmenu)
    : undefined;

  const children =
    submenu && isEnabled(submenu, isAuthenticated)
      ? (submenu.cards ?? [])
          .filter((c) => isEnabled(c, isAuthenticated))
          .map((c) => cardToNode(c, submenus, isAuthenticated))
      : undefined;

  return {
    id: card.id,
    label: card.title,
    href: card.href && card.href !== "#" ? card.href : undefined,
    ...(children?.length ? { children } : {}),
  };
}

/**
 * Funde os dois objetos de navegação do header (`topLevelLinks` e `dropdowns`)
 * numa única árvore de sitemap, respeitando as condições de cada item:
 * - `enabled === false` → removido (via `isEnabled`);
 * - `requiresAuth` com `isAuthenticated === false` → removido;
 * - `card.opensSubmenu` → o nó ganha os `children` do submenu correspondente (recursivo);
 * - `href === "#"` (abre submenu, não navega) → `href` fica `undefined` (nó de secção).
 */
export function buildSitemap(
  data: Pick<HeaderNavigationData, "topLevelLinks" | "dropdowns">,
  isAuthenticated = false
): SitemapNode[] {
  const { topLevelLinks = [], dropdowns = [] } = data;
  const nodes: SitemapNode[] = [];

  // top-level links → nós folha
  for (const link of topLevelLinks) {
    if (!isEnabled(link, isAuthenticated)) continue;
    nodes.push({
      id: link.id ?? link.href,
      label: link.label,
      href: link.href,
      external: link.external ?? undefined,
    });
  }

  // dropdowns → secção (root) + cards (com submenu aninhado)
  for (const d of dropdowns) {
    if (!d.root || !isEnabled(d.root, isAuthenticated)) continue;
    const children = (d.root.cards ?? [])
      .filter((c) => isEnabled(c, isAuthenticated))
      .map((c) => cardToNode(c, d.submenus ?? [], isAuthenticated));
    nodes.push({ id: d.root.id, label: d.root.label, children });
  }

  return nodes;
}
