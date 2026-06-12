"use client";

import { ProgressBar, TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { formatDateToDMY } from "@/utils/formatDate";
import { fetchAdminDatasets, fetchDatasets } from "@/service/api/datasets";
import { Dataset } from "@/service/types/dataset";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import { QUALITY_CRITERIA } from "@/utils/datasetQuality";
import {
  AdminResourceListPage,
  type ServerLoadParams,
} from "@/components/admin/AdminResourceListPage";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";

const SORT_FIELD_MAP: Record<string, string> = {
  title: "title",
  created_at: "created",
  last_modified: "last_update",
};

function buildStatusFilters(status: string) {
  if (status === "public") return { private: false, archived: false, deleted: false };
  if (status === "draft") return { private: true, archived: false, deleted: false };
  if (status === "archived") return { archived: true, deleted: false };
  if (status === "deleted") return { deleted: true };
  return {};
}

async function loadSystemDatasets({ page, pageSize, query, status, sortField, sortOrder }: ServerLoadParams) {
  const apiField = sortField ? SORT_FIELD_MAP[sortField] : null;
  const sort =
    sortOrder === "none" || !apiField
      ? undefined
      : `${sortOrder === "descending" ? "-" : ""}${apiField}`;

  const filters = {
    q: query || undefined,
    sort,
    ...buildStatusFilters(status),
  };

  let response = await fetchAdminDatasets(page, pageSize, filters);
  if (response.total === 0 && !query && !status) {
    response = await fetchDatasets(page, pageSize, filters);
  }
  return { data: response.data ?? [], total: response.total ?? 0 };
}

function renderSystemDatasetRow(dataset: Dataset) {
  const score = calculateQualityScore(QUALITY_CRITERIA, dataset.quality);
  return (
    <TableRow key={dataset.id}>
      <TableCell headerLabel="Título">
        <TextLink href={`/pages/datasets/${dataset.slug}`}>{dataset.title}</TextLink>
      </TableCell>
      <TableCell headerLabel="Estado">
        <ResourceStatusBadge item={dataset} />
      </TableCell>
      <TableCell headerLabel="Criado em">{formatDateToDMY(dataset.created_at)}</TableCell>
      <TableCell headerLabel="Última modificação">{formatDateToDMY(dataset.last_modified)}</TableCell>
      <TableCell headerLabel="Ficheiros">{dataset.resources?.length ?? 0}</TableCell>
      <TableCell headerLabel="Pontuação">
        <div
          className={
            score <= 45
              ? "quality-progress-warning"
              : score > 50
                ? "quality-progress-success"
                : ""
          }
        >
          <ProgressBar value={score} max={100} hidePercentageValue />
        </div>
        <span className="text-xs text-neutral-700">{score}%</span>
      </TableCell>
      <TableCell headerLabel="Ações">
        <TableActionsCell
          viewAction={{ href: `/pages/datasets/${dataset.slug}` }}
          editAction={{ href: `/pages/admin/datasets/${dataset.id}` }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function SystemDatasetsClient() {
  return (
    <AdminResourceListPage<Dataset>
      strategy={{ mode: "server", load: loadSystemDatasets }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Conjuntos de dados", url: "/pages/admin/system/datasets" },
      ]}
      title="Conjuntos de dados"
      searchPlaceholder="Pesquise o nome, código ou sigla da entidade"
      emptyState={{
        icon: "agora-line-edit",
        title: "Sem publicações",
        description: "Nenhum conjunto de dados encontrado.",
      }}
      renderHeaders={(sort) => (
        <>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={sort.getSortOrder("title")}
            onSortChange={sort.onSortChange("title")}
          >
            Título do conjunto de dados
          </TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={sort.getSortOrder("created_at")}
            onSortChange={sort.onSortChange("created_at")}
          >
            Criado em
          </TableHeaderCell>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={sort.getSortOrder("last_modified")}
            onSortChange={sort.onSortChange("last_modified")}
          >
            Última modificação
          </TableHeaderCell>
          <TableHeaderCell>Ficheiros</TableHeaderCell>
          <TableHeaderCell>Pontuação</TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </>
      )}
      renderRow={renderSystemDatasetRow}
    />
  );
}
