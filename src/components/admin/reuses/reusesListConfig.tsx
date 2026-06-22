import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/utils/admin-lists/listColumnHelpers";
import { formatDateToDMY } from "@/utils/formatDate";
import type { Reuse } from "@/service/types/reuse";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";

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
  const direction = sortOrder === "ascending" ? 1 : -1;
  const collator = new Intl.Collator("pt", { sensitivity: "base" });

  return [...items].sort((a, b) => {
    if (sortField === "title") {
      return collator.compare(a.title ?? "", b.title ?? "") * direction;
    }
    if (sortField === "created_at") {
      const aTime = a.created_at ? Date.parse(a.created_at) : 0;
      const bTime = b.created_at ? Date.parse(b.created_at) : 0;
      return (aTime - bTime) * direction;
    }
    const aDatasets = a.datasets?.length ?? 0;
    const bDatasets = b.datasets?.length ?? 0;
    return (aDatasets - bDatasets) * direction;
  });
}

type ReuseSortFieldByDatasets<TSortableDatasets extends boolean> = TSortableDatasets extends true
  ? ReuseSortField
  : SystemReuseSortField;

interface ReuseColumnsOptions<TSortableDatasets extends boolean = true> {
  showOwner?: boolean;
  linkStyle?: "textLink" | "anchor";
  editHref: (reuse: Reuse) => string;
  sortableDatasets?: TSortableDatasets;
}

export function createReuseColumns<TSortableDatasets extends boolean = true>({
  showOwner = false,
  linkStyle = "textLink",
  editHref,
  sortableDatasets = true as TSortableDatasets,
}: ReuseColumnsOptions<TSortableDatasets>): AdminListColumn<
  Reuse,
  ReuseSortFieldByDatasets<TSortableDatasets>
>[] {
  return [
    {
      id: "title",
      header: "Título da reutilização",
      headerLabel: "Título",
      sortField: "title" as ReuseSortFieldByDatasets<TSortableDatasets>,
      sortType: "numeric",
      renderCell: (reuse) =>
        linkStyle === "textLink" ? (
          <TextLink href={`/reuses/${reuse.slug}`}>{reuse.title}</TextLink>
        ) : (
          <a href={`/reuses/${reuse.slug}`} className="text-primary-600 underline">
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
      sortField: "created_at" as ReuseSortFieldByDatasets<TSortableDatasets>,
      sortType: "date",
      renderCell: (reuse) => (
        <>
          {formatDateToDMY(reuse.created_at)}
          {showOwner && (
            <>
              <br />
              <span className="text-sm text-neutral-500">
                {reuse.owner ? (
                  <TextLink href={`/users/${reuse.owner.slug}`} className="text-xs">
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
      sortField: sortableDatasets
        ? ("datasets" as ReuseSortFieldByDatasets<TSortableDatasets>)
        : undefined,
      sortType: sortableDatasets ? "numeric" : undefined,
      renderCell: (reuse) => reuse.datasets?.length ?? 0,
    },
    createTableActionsColumn<Reuse>({
      viewAction: (reuse) => ({
        href: `/reuses/${reuse.slug}`,
      }),
      editAction: (reuse) => ({
        href: editHref(reuse),
      }),
    }),
  ];
}

