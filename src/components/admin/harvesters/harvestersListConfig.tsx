import { Icon } from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import {
  createDateSorter,
  createLocaleStringSorter,
  sortItems,
} from "@/components/admin/lists/listHelpers";
import type { HarvestSource } from "@/service/types/harvester";
import { formatDateToDMY } from "@/utils/formatDate";
import { getHarvesterStatus } from "@/utils/harvesterStatus";

export type HarvesterSortField = "name" | "created_at" | "last_job";

export function getLastJobTimestamp(harvester: HarvestSource): number {
  const job = harvester.last_job;
  if (!job) return 0;
  const value = job.started ?? job.ended ?? job.created;
  return value ? Date.parse(value) : 0;
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
    created_at: createDateSorter((harvester) => harvester.created_at),
    last_job: (a, b) => getLastJobTimestamp(a) - getLastJobTimestamp(b),
  });
}

interface OrgHarvesterColumnsOptions {
  editHref: (harvester: HarvestSource) => string;
}

interface SystemHarvesterColumnsOptions {
  isAdmin: boolean;
  onApprove: (harvester: HarvestSource) => void;
  onReject: (harvester: HarvestSource) => void;
}

export function createOrgHarvesterColumns({
  editHref,
}: OrgHarvesterColumnsOptions): AdminListColumn<HarvestSource, HarvesterSortField>[] {
  return [
    {
      id: "name",
      header: "Nome",
      sortField: "name",
      sortType: "string",
      renderCell: (harvester) => <TextLink href={editHref(harvester)}>{harvester.name}</TextLink>,
    },
    {
      id: "status",
      header: "Estado",
      renderCell: (harvester) => {
        const status = getHarvesterStatus(harvester);
        return <StatusDot variant={status.variant}>{status.label}</StatusDot>;
      },
    },
    {
      id: "implementation",
      header: "Implementação",
      renderCell: (harvester) => harvester.backend,
    },
    {
      id: "created_at",
      header: "Criado em",
      sortField: "created_at",
      sortType: "date",
      renderCell: (harvester) => formatDateToDMY(harvester.created_at),
    },
    {
      id: "last_job",
      header: "Última execução",
      sortField: "last_job",
      sortType: "date",
      renderCell: (harvester) =>
        harvester.last_job
          ? formatDateToDMY(harvester.last_job.started ?? harvester.last_job.ended ?? "")
          : "Ainda não",
    },
    {
      id: "datasets",
      header: "Conjuntos de dados",
      renderCell: (harvester) => harvester.datasets_count ?? 0,
    },
    {
      id: "api",
      header: "API",
      renderCell: (harvester) => harvester.backend,
    },
    {
      id: "actions",
      header: "Ações",
      headerLabel: "Ações",
      renderCell: (harvester) => (
        <TableActionsCell
          editAction={{
            href: editHref(harvester),
          }}
        />
      ),
    },
  ];
}

export function createSystemHarvesterColumns({
  isAdmin,
  onApprove,
  onReject,
}: SystemHarvesterColumnsOptions): AdminListColumn<HarvestSource>[] {
  return [
    {
      id: "name",
      header: "Nome",
      renderCell: (harvester) => (
        <TextLink href={`/pages/admin/harvesters/${harvester.id}`}>{harvester.name}</TextLink>
      ),
    },
    {
      id: "status",
      header: "Estado",
      renderCell: (harvester) => {
        const status = getHarvesterStatus(harvester);
        return <StatusDot variant={status.variant}>{status.label}</StatusDot>;
      },
    },
    {
      id: "implementation",
      header: "Implementação",
      renderCell: (harvester) => harvester.backend,
    },
    {
      id: "created_at",
      header: "Criado em",
      renderCell: (harvester) => formatDateToDMY(harvester.created_at),
    },
    {
      id: "last_job",
      header: "Última execução",
      renderCell: (harvester) =>
        harvester.last_job?.ended ? formatDateToDMY(harvester.last_job.ended) : "Ainda não",
    },
    {
      id: "datasets",
      header: "Conjuntos de dados",
      renderCell: (harvester) => harvester.datasets_count ?? 0,
    },
    {
      id: "api",
      header: "API",
      renderCell: () => "0",
    },
    {
      id: "actions",
      header: "Ações",
      headerLabel: "Ações",
      renderCell: (harvester) => (
        <div className="flex items-center gap-[12px]">
          {isAdmin && harvester.validation?.state === "pending" && (
            <>
              <button
                type="button"
                aria-label={`Aprovar harvester ${harvester.name}`}
                title="Aprovar harvester"
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
                aria-label={`Rejeitar harvester ${harvester.name}`}
                title="Rejeitar harvester"
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
            editAction={{
              href: `/pages/admin/harvesters/${harvester.id}?tab=config`,
            }}
          />
        </div>
      ),
    },
  ];
}
