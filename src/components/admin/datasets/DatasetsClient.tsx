"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  ProgressBar,
} from "@ama-pt/agora-design-system";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchMyDatasets } from "@/services/api";
import { Dataset } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import TextLink from "@/components/Primitives/TextLink";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import AdminEmptyState from "../AdminEmptyState";
import TableActionsCell from "../TableActionsCell";
import { QUALITY_CRITERIA } from "@/utils/datasetQuality";

type SortField = "title" | "created_at" | "last_modified" | "resources";

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function DatasetsClient() {
  const { displayName } = useCurrentUser();
  const searchParams = useSearchParams();

  const [allDatasets, setAllDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");

  useEffect(() => {
    async function loadDatasets() {
      setIsLoading(true);
      try {
        const response = await fetchMyDatasets(1, 9999);
        setAllDatasets(response.data || []);
      } catch (error) {
        console.error("Error loading datasets:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDatasets();
  }, []);

  const filteredDatasets = useMemo(() => {
    let result = allDatasets;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.acronym && d.acronym.toLowerCase().includes(q)) ||
          d.slug.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = filterByStatus(result, statusFilter);
    } else {
      result = result.filter((d) => !d.deleted);
    }

    return result;
  }, [allDatasets, searchQuery, statusFilter]);

  const sortedDatasets = useMemo(() => {
    if (sortOrder === "none") return filteredDatasets;

    return [...filteredDatasets].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "last_modified":
          cmp = new Date(a.last_modified).getTime() - new Date(b.last_modified).getTime();
          break;
        case "resources":
          cmp = (a.resources?.length || 0) - (b.resources?.length || 0);
          break;
      }
      return sortOrder === "descending" ? -cmp : cmp;
    });
  }, [filteredDatasets, sortField, sortOrder]);

  const datasets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDatasets.slice(start, start + pageSize);
  }, [sortedDatasets, currentPage, pageSize]);

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Conjuntos de dados", url: "/pages/admin/me/datasets" },
      ]}
      title="Conjuntos de Dados"
      isLoading={isLoading}
      count={sortedDatasets.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome, código ou sigla da entidade",
        ariaLabel: "Pesquisar conjuntos de dados",
        onChange: (value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        },
      }}
      filters={
        <StatusFilterSelect
          value={statusFilter}
          defaultValue={statusFilter || undefined}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      }
      emptyState={
        <AdminEmptyState
          icon="agora-line-edit"
          title="Sem conjuntos de dados"
          description="Não publicou conjuntos de dados."
          createUrl="/pages/admin/datasets/new"
        />
      }
    >
      <TableHeader>
        <TableRow>
          <TableHeaderCell
            sortType="date"
            sortOrder={getSortOrder("title")}
            onSortChange={handleSort("title")}
          >
            Título do conjunto de dados
          </TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={getSortOrder("created_at")}
            onSortChange={handleSort("created_at")}
          >
            Criado em
          </TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={getSortOrder("last_modified")}
            onSortChange={handleSort("last_modified")}
          >
            Última modificação
          </TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={getSortOrder("resources")}
            onSortChange={handleSort("resources")}
          >
            Ficheiros
          </TableHeaderCell>
          <TableHeaderCell>Pontuações</TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {datasets.map((dataset) => {
          const score = calculateQualityScore(QUALITY_CRITERIA, dataset.quality);

          return (
            <TableRow key={dataset.id}>
              <TableCell headerLabel="Título">
                <TextLink href={`/pages/datasets/${dataset.slug}`}>{dataset.title}</TextLink>
              </TableCell>
              <TableCell headerLabel="Estado">
                <ResourceStatusBadge item={dataset} />
              </TableCell>
              <TableCell headerLabel="Criado em">{formatDate(dataset.created_at)}</TableCell>
              <TableCell headerLabel="Última modificação">
                <div>
                  <div>{formatDate(dataset.last_modified)}</div>
                  {dataset.owner && (
                    <TextLink href={`/pages/users/${dataset.owner.slug}`} className="text-xs">
                      {dataset.owner.first_name} {dataset.owner.last_name}
                    </TextLink>
                  )}
                </div>
              </TableCell>
              <TableCell headerLabel="Ficheiros">{dataset.resources?.length || 0}</TableCell>
              <TableCell headerLabel="Pontuações">
                <div
                  className={
                    score <= 45 ? "quality-progress-warning" : score > 50 ? "quality-progress-success" : ""
                  }
                >
                  <ProgressBar value={score} max={100} hidePercentageValue={true} />
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
        })}
      </TableBody>
    </AdminListPage>
  );
}
