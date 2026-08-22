import { Icon } from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import {
  createDateSorter,
  createLocaleStringSorter,
  sortItems,
} from "@/utils/admin-lists/listHelpers";
import type { HarvestSource } from "@/service/types/harvester";
import { can } from "@/utils/permissions";
import { formatDateToDMY } from "@/utils/formatDate";
import { getHarvesterStatus, type HarvesterStatusLabels } from "@/utils/harvesterStatus";

export type HarvesterSortField = "name" | "status" | "created_at" | "last_job";

/**
 * The harvest sources endpoint paginates but cannot search, filter by status or sort, so
 * both views load the whole (small) catalogue once and do that work client-side. Keep this
 * in sync with the API page_size ceiling if the catalogue ever outgrows a single request.
 */
export const HARVESTERS_FETCH_PAGE_SIZE = 9999;

export function getLastJobTimestamp(harvester: HarvestSource): number {
  const job = harvester.last_job;
  if (!job) return 0;
  const value = job.started ?? job.ended ?? job.created;
  return value ? Date.parse(value) : 0;
}

function getHarvesterStatusSortValue(harvester: HarvestSource): string {
  const validationState = harvester.validation?.state ?? "pending";
  const lastJobStatus = harvester.last_job?.status ?? "no_job";
  return `${validationState}:${lastJobStatus}`;
}

export function filterHarvestersBySearch(harvesters: HarvestSource[], searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return harvesters;

  return harvesters.filter((harvester) => harvester.name.toLowerCase().includes(query));
}

export function filterHarvestersByStatus(harvesters: HarvestSource[], statusFilter: string) {
  if (!statusFilter) return harvesters;

  return harvesters.filter((harvester) => {
    if (statusFilter === "failed") {
      return harvester.last_job?.status === "failed";
    }
    if (statusFilter === "done") {
      return harvester.last_job?.status === "done";
    }
    const state = harvester.validation?.state ?? "pending";
    return state === statusFilter;
  });
}

export function sortHarvesters(
  harvesters: HarvestSource[],
  sortField: HarvesterSortField | null,
  sortOrder: "ascending" | "descending" | "none"
) {
  return sortItems(harvesters, sortField, sortOrder, {
    name: createLocaleStringSorter((harvester) => harvester.name),
    status: createLocaleStringSorter(getHarvesterStatusSortValue),
    created_at: createDateSorter((harvester) => harvester.created_at),
    last_job: (a, b) => getLastJobTimestamp(a) - getLastJobTimestamp(b),
  });
}

interface OrgHarvesterColumnsOptions {
  editHref: (harvester: HarvestSource) => string;
  labels: HarvesterColumnLabels;
  statusLabels: HarvesterStatusLabels;
}

interface SystemHarvesterColumnsOptions {
  onApprove: (harvester: HarvestSource) => void;
  onReject: (harvester: HarvestSource) => void;
  labels: HarvesterColumnLabels;
  statusLabels: HarvesterStatusLabels;
  actions: HarvesterActionLabels;
}

interface HarvesterColumnLabels {
  name: string;
  status: string;
  implementation: string;
  createdAt: string;
  lastJob: string;
  datasets: string;
  api: string;
  actions: string;
  notYet: string;
}

interface HarvesterActionLabels {
  approveHarvester: string;
  rejectHarvester: string;
  approveHarvesterNamed: (name: string) => string;
  rejectHarvesterNamed: (name: string) => string;
}

export function createOrgHarvesterColumns({
  editHref,
  labels,
  statusLabels,
}: OrgHarvesterColumnsOptions): AdminListColumn<HarvestSource, HarvesterSortField>[] {
  return [
    {
      id: "name",
      header: labels.name,
      sortField: "name",
      sortType: "string",
      renderCell: (harvester) => <TextLink href={editHref(harvester)}>{harvester.name}</TextLink>,
    },
    {
      id: "status",
      header: labels.status,
      sortField: "status",
      sortType: "string",
      renderCell: (harvester) => {
        const status = getHarvesterStatus(harvester, statusLabels);
        return <StatusDot variant={status.variant}>{status.label}</StatusDot>;
      },
    },
    {
      id: "implementation",
      header: labels.implementation,
      renderCell: (harvester) => harvester.backend,
    },
    {
      id: "created_at",
      header: labels.createdAt,
      sortField: "created_at",
      sortType: "date",
      renderCell: (harvester) => formatDateToDMY(harvester.created_at),
    },
    {
      id: "last_job",
      header: labels.lastJob,
      sortField: "last_job",
      sortType: "date",
      renderCell: (harvester) =>
        harvester.last_job
          ? formatDateToDMY(harvester.last_job.started ?? harvester.last_job.ended ?? "")
          : labels.notYet,
    },
    {
      id: "datasets",
      header: labels.datasets,
      renderCell: (harvester) => harvester.datasets_count ?? 0,
    },
    {
      id: "api",
      header: labels.api,
      renderCell: (harvester) => harvester.backend,
    },
    {
      id: "actions",
      header: labels.actions,
      headerLabel: labels.actions,
      // Edit/run/delete require org-admin (HarvestSourceAdminPermission); an
      // editor only gets preview, so show a read-only view link instead.
      renderCell: (harvester) => (
        <TableActionsCell
          viewAction={can(harvester, "edit") ? undefined : { href: editHref(harvester) }}
          editAction={
            can(harvester, "edit") ? { href: `${editHref(harvester)}?tab=config` } : undefined
          }
        />
      ),
    },
  ];
}

export function createSystemHarvesterColumns({
  onApprove,
  onReject,
  labels,
  statusLabels,
  actions,
}: SystemHarvesterColumnsOptions): AdminListColumn<HarvestSource, HarvesterSortField>[] {
  return [
    {
      id: "name",
      header: labels.name,
      renderCell: (harvester) => (
        <TextLink href={`/admin/harvesters/${harvester.id}`}>{harvester.name}</TextLink>
      ),
    },
    {
      id: "status",
      header: labels.status,
      sortField: "status",
      sortType: "string",
      renderCell: (harvester) => {
        const status = getHarvesterStatus(harvester, statusLabels);
        return <StatusDot variant={status.variant}>{status.label}</StatusDot>;
      },
    },
    {
      id: "implementation",
      header: labels.implementation,
      renderCell: (harvester) => harvester.backend,
    },
    {
      id: "created_at",
      header: labels.createdAt,
      renderCell: (harvester) => formatDateToDMY(harvester.created_at),
    },
    {
      id: "last_job",
      header: labels.lastJob,
      renderCell: (harvester) =>
        harvester.last_job?.ended ? formatDateToDMY(harvester.last_job.ended) : labels.notYet,
    },
    {
      id: "datasets",
      header: labels.datasets,
      renderCell: (harvester) => harvester.datasets_count ?? 0,
    },
    {
      id: "api",
      header: labels.api,
      renderCell: () => "0",
    },
    {
      id: "actions",
      header: labels.actions,
      headerLabel: labels.actions,
      renderCell: (harvester) => (
        <div className="flex items-center gap-[12px]">
          {can(harvester, "validate") && harvester.validation?.state === "pending" && (
            <>
              <button
                type="button"
                aria-label={actions.approveHarvesterNamed(harvester.name)}
                title={actions.approveHarvester}
                onClick={(event) => {
                  event.stopPropagation();
                  onApprove(harvester);
                }}
              >
                <Icon
                  name="agora-line-check-circle"
                  className="h-[20px] w-[20px] text-success-600"
                />
              </button>
              <button
                type="button"
                aria-label={actions.rejectHarvesterNamed(harvester.name)}
                title={actions.rejectHarvester}
                onClick={(event) => {
                  event.stopPropagation();
                  onReject(harvester);
                }}
              >
                <Icon
                  name="agora-line-x-circle"
                  className="h-[20px] w-[20px] text-danger-600"
                />
              </button>
            </>
          )}
          <TableActionsCell
            viewAction={
              can(harvester, "edit")
                ? undefined
                : { href: `/admin/harvesters/${harvester.id}` }
            }
            editAction={
              can(harvester, "edit")
                ? { href: `/admin/harvesters/${harvester.id}?tab=config` }
                : undefined
            }
          />
        </div>
      ),
    },
  ];
}

