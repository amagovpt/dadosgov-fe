import { getHeaderNavigation } from "@/service/commom/header";
import { getAdminSideNavigation } from "@/service/commom/adminSideNavigation";
import type { HeaderNavigationData, HeaderNavCard } from "@/service/types/header";
import type { AdminSideNavigationData } from "@/service/types/admin-side-navigation";

/**
 * Route gatekeeper — builds the list of disabled routes from the two Squidex
 * navigation singletons (public Header + Admin sidebar). A route is "disabled"
 * when its `enabled` flag (or an ancestor group's flag) is explicitly `false`.
 *
 * The proxy uses this list to return a 404 for any request targeting a disabled
 * route or a descendant of one (see `isPathRestricted`).
 *
 * Design notes:
 *  - Reuses the existing typed fetchers rather than re-querying GraphQL.
 *  - Fails open: if a source rejects (CMS down), it contributes no restrictions
 *    so the whole site is never 404'd because of a transient CMS error.
 *  - A route enabled in *any* nav wins (OR-dedup): only paths that are disabled
 *    everywhere they appear end up in the output.
 */

// `enabled` is nullable in the CMS schema; only an explicit `false` disables.
const isActive = (enabled: boolean | null | undefined): boolean => enabled !== false;

/** Normalize an internal href to a locale-prefixed path, or null if not routable. */
function toLocalePath(href: string | null | undefined, locale: string): string | null {
  if (!href || !href.startsWith("/")) return null; // skip external / hash / empty
  const trimmed = href.replace(/\/+$/, ""); // drop trailing slashes
  return `/${locale}${trimmed}`;
}

/** Merge a path into the map: a route active anywhere stays active. */
function accumulate(map: Map<string, boolean>, path: string | null, active: boolean): void {
  if (!path) return;
  map.set(path, (map.get(path) ?? false) || active);
}

function collectHeaderRestrictions(
  map: Map<string, boolean>,
  header: HeaderNavigationData,
  locale: string
): void {
  const addCards = (cards: HeaderNavCard[] | undefined, groupActive: boolean) => {
    (cards ?? []).forEach((card) => {
      accumulate(map, toLocalePath(card.href, locale), groupActive && isActive(card.enabled));
    });
  };

  (header.topLevelLinks ?? []).forEach((link) => {
    if (link.external) return;
    accumulate(map, toLocalePath(link.href, locale), isActive(link.enabled));
  });

  (header.dropdowns ?? []).forEach((dropdown) => {
    const rootActive = isActive(dropdown.root?.enabled);
    addCards(dropdown.root?.cards, rootActive);

    (dropdown.submenus ?? []).forEach((submenu) => {
      addCards(submenu.cards, isActive(submenu.enabled));
    });
  });
}

function collectAdminRestrictions(
  map: Map<string, boolean>,
  admin: AdminSideNavigationData,
  locale: string
): void {
  
  (admin.groups ?? []).forEach((group) => {
    const groupActive = isActive(group.enabled);
    (group.children ?? []).forEach((child) => {
      accumulate(map, toLocalePath(child.href, locale), groupActive && isActive(child.enabled));
    });
  });

  // orgChildren hrefs are per-org suffixes applied as `/admin/org/{id}/{suffix}`.
  // The org id varies, so register a single-segment wildcard so the matcher
  // blocks the disabled tab for every org.
  (admin.orgChildren ?? []).forEach((child) => {
    const suffix = child.href?.replace(/^\/+/, "");
    if (!suffix) return;
    accumulate(map, `/${locale}/admin/org/*/${suffix}`, isActive(child.enabled));
  });
}

// Short-lived module-level memo so we don't rebuild the list on every request.
// Apollo's TtlApolloClient already dedupes the network calls; this just avoids
// re-mapping within a burst of requests.
const MEMO_TTL_MS = 60_000;
const memo = new Map<string, { at: number; paths: string[] }>();

export async function getRouteRestrictions(locale: string): Promise<string[]> {
  const cached = memo.get(locale);
  if (cached && Date.now() - cached.at < MEMO_TTL_MS) return cached.paths;

  const map = new Map<string, boolean>();

  const [header, admin] = await Promise.allSettled([
    getHeaderNavigation(locale),
    getAdminSideNavigation(locale),
  ]);

  if (header.status === "fulfilled") {
    collectHeaderRestrictions(map, header.value, locale);
  } else {
    console.error("Route gatekeeper: failed to load header navigation", header.reason);
  }

  if (admin.status === "fulfilled") {
    collectAdminRestrictions(map, admin.value, locale);
  } else {
    console.error("Route gatekeeper: failed to load admin side navigation", admin.reason);
  }

  const paths = Array.from(map.entries())
    .filter(([, active]) => !active)
    .map(([path]) => path);

  memo.set(locale, { at: Date.now(), paths });
  return paths;
}
