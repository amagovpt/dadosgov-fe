import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/utils/admin-lists/listColumnHelpers";
import { formatDateToDMY } from "@/utils/formatDate";
import type { Dataservice } from "@/service/types/dataservice";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";

export type DataserviceSortField = "title" | "created_at" | "last_modified";

export const dataserviceSortFieldMap: Record<DataserviceSortField, string> = {
  title: "title",
  created_at: "created",
  last_modified: "last_modified",
};

export function sortDataservices(
  items: Dataservice[],
  sortField: DataserviceSortField | null,
  sortOrder: SortOrder
): Dataservice[] {
  if (!sortField || sortOrder === "none") return items;
  const dir = sortOrder === "ascending" ? 1 : -1;
  const collator = new Intl.Collator("pt", { sensitivity: "base" });

  return [...items].sort((a, b) => {
    if (sortField === "title") {
      return collator.compare(a.title ?? "", b.title ?? "") * dir;
    }
    const aValue = sortField === "created_at" ? a.created_at : a.last_modified;
    const bValue = sortField === "created_at" ? b.created_at : b.last_modified;
    const aTime = aValue ? Date.parse(aValue) : 0;
    const bTime = bValue ? Date.parse(bValue) : 0;
    return (aTime - bTime) * dir;
  });
}

interface DataserviceColumnsOptions {
  ownerMetaStyle?: "dot" | "by";
}

export function createDataserviceColumns({
  ownerMetaStyle = "dot",
}: DataserviceColumnsOptions = {}): AdminListColumn<Dataservice, DataserviceSortField>[] {
  return [
    {
      id: "title",
      header: "Título da API",
      headerLabel: "Título",
      sortField: "title",
      sortType: "numeric",
      renderCell: (api) => <TextLink href={`/dataservices/${api.slug}`}>{api.title}</TextLink>,
    },
    {
      id: "status",
      header: "Estado",
      renderCell: (api) => <ResourceStatusBadge item={api} />,
    },
    {
      id: "created_at",
      header: "Criado em",
      sortField: "created_at",
      sortType: "date",
      renderCell: (api) => formatDateToDMY(api.created_at),
    },
    {
      id: "last_modified",
      header: "Modificado em",
      sortField: "last_modified",
      sortType: "date",
      renderCell: (api) => (
        <>
          {formatDateToDMY(api.last_modified)}
          {api.owner && (
            <>
              <br />
              <span className="text-sm text-neutral-500">
                {ownerMetaStyle === "by" ? "por" : "sobre"}{" "}
                {ownerMetaStyle === "dot" ? <span className="text-success-600">●</span> : null}{" "}
                {api.owner.first_name} {api.owner.last_name}
              </span>
            </>
          )}
        </>
      ),
    },
    createTableActionsColumn<Dataservice>({
      viewAction: (api) => ({
        href: `/dataservices/${api.slug}`,
      }),
      editAction: (api) => ({
        href: `/admin/dataservices/edit?slug=${api.slug}`,
      }),
    }),
  ];
}

