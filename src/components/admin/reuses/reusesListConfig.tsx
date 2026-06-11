import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/components/admin/lists/listColumnHelpers";
import { formatDateToDMY } from "@/utils/formatDate";
import type { Reuse } from "@/types/api";
import type { SortOrder } from "@/components/admin/lists/useClientTableState";

export type ReuseSortField = "title" | "created_at" | "datasets";
export type SystemReuseSortField = "title" | "created_at";

export const systemReuseSortFieldMap: Record<SystemReuseSortField, string> = {
  title: "title",
  created_at: "created",
};

export function sortReuses(
  items: Reuse[],
  sortField: ReuseSortField | null,
  sortOrder: SortOrder
): Reuse[] {
  if (!sortField || sortOrder === "none") return items;
  const dir = sortOrder === "ascending" ? 1 : -1;
  const collator = new Intl.Collator("pt", { sensitivity: "base" });

  return [...items].sort((a, b) => {
    if (sortField === "title") {
      return collator.compare(a.title ?? "", b.title ?? "") * dir;
    }
    if (sortField === "created_at") {
      const at = a.created_at ? Date.parse(a.created_at) : 0;
      const bt = b.created_at ? Date.parse(b.created_at) : 0;
      return (at - bt) * dir;
    }
    const ad = a.datasets?.length ?? 0;
    const bd = b.datasets?.length ?? 0;
    return (ad - bd) * dir;
  });
}

interface ReuseColumnsOptions {
  showOwner?: boolean;
  linkStyle?: "textLink" | "anchor";
  editHref: (reuse: Reuse) => string;
  sortableDatasets?: boolean;
}

export function createReuseColumns({
  showOwner = false,
  linkStyle = "textLink",
  editHref,
  sortableDatasets = true,
}: ReuseColumnsOptions): AdminListColumn<Reuse, ReuseSortField>[] {
  return [
    {
      id: "title",
      header: "Título da reutilização",
      headerLabel: "Título",
      sortField: "title",
      sortType: "numeric",
      renderCell: (reuse) =>
        linkStyle === "textLink" ? (
          <TextLink href={`/pages/reuses/${reuse.slug}`}>{reuse.title}</TextLink>
        ) : (
          <a href={`/pages/reuses/${reuse.slug}`} className="text-primary-600 underline">
            {reuse.title}
          </a>
        ),
    },
    {
      id: "status",
      header: "Estado",
      renderCell: (reuse) => <ResourceStatusBadge item={reuse} />,
    },
    {
      id: "created_at",
      header: "Criado em",
      sortField: "created_at",
      sortType: "date",
      renderCell: (reuse) => (
        <>
          {formatDateToDMY(reuse.created_at)}
          {showOwner && (
            <>
              <br />
              <span className="text-sm text-neutral-500">
                {reuse.owner ? (
                  <TextLink href={`/pages/users/${reuse.owner.slug}`} className="text-xs">
                    {reuse.owner.first_name} {reuse.owner.last_name}
                  </TextLink>
                ) : (
                  "—"
                )}
              </span>
            </>
          )}
        </>
      ),
    },
    {
      id: "datasets",
      header: "Conjuntos de dados",
      headerLabel: "Conjuntos de dados",
      sortField: sortableDatasets ? "datasets" : undefined,
      sortType: sortableDatasets ? "numeric" : undefined,
      renderCell: (reuse) => reuse.datasets?.length ?? 0,
    },
    createTableActionsColumn<Reuse>({
      viewAction: (reuse) => ({
        href: `/pages/reuses/${reuse.slug}`,
      }),
      editAction: (reuse) => ({
        href: editHref(reuse),
      }),
    }),
  ];
}
