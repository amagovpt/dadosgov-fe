"use client";

import { useSearchParams } from "next/navigation";
import { ProgressBar, TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchMyDatasets } from "@/service/api/datasets";
import { Dataset } from "@/service/types/dataset";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { filterByStatus } from "@/utils/filterByStatus";
import { formatDateToDMY } from "@/utils/formatDate";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import { QUALITY_CRITERIA } from "@/utils/datasetQuality";
import { AdminResourceListPage, type SortOrder } from "@/components/admin/AdminResourceListPage";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";

function filterDatasets(items: Dataset[], query: string, status: string): Dataset[] {
  let result = items;
  if (query) {
    const q = query.toLowerCase();
    result = result.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q) ||
        (d.acronym?.toLowerCase().includes(q) ?? false),
    );
  }
  return status ? filterByStatus(result, status) : result.filter((d) => !d.deleted);
}

function sortDatasets(items: Dataset[], field: string | null, order: SortOrder): Dataset[] {
  if (!field || order === "none") return items;
  const dir = order === "ascending" ? 1 : -1;
  return [...items].sort((a, b) => {
    switch (field) {
      case "title":
        return (a.title ?? "").localeCompare(b.title ?? "") * dir;
      case "resources":
        return ((a.resources?.length ?? 0) - (b.resources?.length ?? 0)) * dir;
      case "created_at":
        return (Date.parse(a.created_at) - Date.parse(b.created_at)) * dir;
      default:
        return (Date.parse(a.last_modified) - Date.parse(b.last_modified)) * dir;
    }
  });
}

function renderDatasetRow(dataset: Dataset) {
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
      <TableCell headerLabel="Última modificação">
        <div>{formatDateToDMY(dataset.last_modified)}</div>
        {dataset.owner && (
          <TextLink href={`/pages/users/${dataset.owner.slug}`} className="text-xs">
            {dataset.owner.first_name} {dataset.owner.last_name}
          </TextLink>
        )}
      </TableCell>
      <TableCell headerLabel="Ficheiros">{dataset.resources?.length ?? 0}</TableCell>
      <TableCell headerLabel="Pontuações">
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
          editAction={{ href: `/pages/admin/me/datasets/edit?id=${dataset.id}` }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function DatasetsClient() {
  const { displayName } = useCurrentUser();
  const searchParams = useSearchParams();

  return (
    <AdminResourceListPage<Dataset>
      strategy={{
        mode: "client",
        load: async () => {
          const res = await fetchMyDatasets(1, 9999);
          return res.data ?? [];
        },
        filter: filterDatasets,
        sort: sortDatasets,
      }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Conjuntos de dados", url: "/pages/admin/me/datasets" },
      ]}
      title="Conjuntos de Dados"
      searchPlaceholder="Pesquise o nome, código ou sigla da entidade"
      initialStatus={searchParams.get("status") ?? ""}
      emptyState={{
        icon: "agora-line-edit",
        title: "Sem conjuntos de dados",
        description: "Não publicou conjuntos de dados.",
        createUrl: "/pages/admin/datasets/new",
      }}
      renderHeaders={(sort) => (
        <>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("title")}
            onSortChange={sort.onSortChange("title")}
          >
            Título do conjunto de dados
          </TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("created_at")}
            onSortChange={sort.onSortChange("created_at")}
          >
            Criado em
          </TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("last_modified")}
            onSortChange={sort.onSortChange("last_modified")}
          >
            Última modificação
          </TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("resources")}
            onSortChange={sort.onSortChange("resources")}
          >
            Ficheiros
          </TableHeaderCell>
          <TableHeaderCell>Pontuações</TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </>
      )}
      renderRow={renderDatasetRow}
    />
  );
}
