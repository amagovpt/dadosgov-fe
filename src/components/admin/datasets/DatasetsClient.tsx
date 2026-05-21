"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  Button,
  CardNoResults,
  Icon,
  InputSelect,
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  ProgressBar,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchMyDatasets } from "@/services/api";
import { Dataset } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { Dropdown } from "@/components/Primitives/Dropdown";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";
import { filterByStatus } from "@/utils/filterByStatus";
import AdminEmptyState from "../AdminEmptyState";

const QUALITY_CRITERIA: [keyof NonNullable<Dataset["quality"]>, string][] = [
  ["dataset_description_quality", "Descrição"],
  ["has_resources", "Recursos"],
  ["license", "Licença"],
  ["has_open_format", "Formato aberto"],
  ["all_resources_available", "Recursos disponíveis"],
  ["resources_documentation", "Documentação"],
  ["spatial", "Cobertura espacial"],
  ["temporal_coverage", "Cobertura temporal"],
  ["update_frequency", "Frequência de atualização"],
];

type SortOrder = "none" | "ascending" | "descending";
type SortField = "title" | "created_at" | "last_modified" | "resources";

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
      // By default, hide deleted datasets
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

  const totalItems = sortedDatasets.length;
  const start = (currentPage - 1) * pageSize;
  const datasets = sortedDatasets.slice(start, start + pageSize);

  const handleSort = (field: SortField) => (newOrder: SortOrder) => {
    setSortField(field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: SortField): SortOrder => {
    return sortField === field ? sortOrder : "none";
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: displayName || "...", url: "#" },
            { label: "Conjuntos de dados", url: "/pages/admin/me/datasets" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Conjuntos de dados</h1>
        <PublishDropdown />
      </div>

      <p className="text-sm mb-16 text-neutral-700">
        {isLoading ? "A carregar..." : `${totalItems} resultados`}
      </p>

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome, código ou sigla da entidade"
            aria-label="Pesquisar conjuntos de dados"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <InputSelect
          label=""
          hideLabel
          placeholder="Filtrar por estado"
          id="filter-status"
          defaultValue={statusFilter || undefined}
          onChange={(options) => {
            setStatusFilter(options.length > 0 ? (options[0].value as string) : "");
            setCurrentPage(1);
          }}
        >
          <Dropdown.Section name="status">
            <Dropdown.Option value="" selected={statusFilter === ""}>
              Todos
            </Dropdown.Option>
            <Dropdown.Option value="public" selected={statusFilter === "public"}>
              Público
            </Dropdown.Option>
            <Dropdown.Option value="archived" selected={statusFilter === "archived"}>
              Arquivado
            </Dropdown.Option>
            <Dropdown.Option value="draft" selected={statusFilter === "draft"}>
              Rascunho
            </Dropdown.Option>
            <Dropdown.Option value="deleted" selected={statusFilter === "deleted"}>
              Excluído
            </Dropdown.Option>
          </Dropdown.Section>
        </InputSelect>
      </div>

      {!isLoading && totalItems > 0 ? (
        <Table
          paginationProps={createPaginationProps(
            pageSize,
            totalItems,
            currentPage,
            setCurrentPage,
            setPageSize
          )}
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
            {datasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell headerLabel="Título">
                  <TextLink href={`/pages/datasets/${dataset.slug}`}>{dataset.title}</TextLink>
                </TableCell>
                <TableCell headerLabel="Estado">
                  {dataset.deleted ? (
                    <StatusDot variant="danger">Excluído</StatusDot>
                  ) : dataset.archived ? (
                    <StatusDot variant="neutral">Arquivado</StatusDot>
                  ) : dataset.private ? (
                    <StatusDot variant="warning">Rascunho</StatusDot>
                  ) : (
                    <StatusDot variant="success">Público</StatusDot>
                  )}
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
                      calculateQualityScore(QUALITY_CRITERIA, dataset.quality) <= 45
                        ? "quality-progress-warning"
                        : calculateQualityScore(QUALITY_CRITERIA, dataset.quality) > 50
                          ? "quality-progress-success"
                          : ""
                    }
                  >
                    <ProgressBar
                      value={calculateQualityScore(QUALITY_CRITERIA, dataset.quality)}
                      max={100}
                      hidePercentageValue={true}
                    />
                  </div>
                  <span className="text-xs text-neutral-700">
                    {calculateQualityScore(QUALITY_CRITERIA, dataset.quality)}%
                  </span>
                </TableCell>
                <TableCell headerLabel="Ações">
                  <div className="flex gap-8">
                    <a href={`/pages/datasets/${dataset.slug}`}>
                      <Icon name="agora-line-eye" className="h-[20px] w-[20px]" />
                    </a>
                    <a href={`/pages/admin/me/datasets/edit?id=${dataset.id}`}>
                      <Icon name="agora-line-edit" className="h-[20px] w-[20px]" />
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <AdminEmptyState
          icon="agora-line-edit"
          title="Sem conjuntos de dados"
          description="Não publicou conjuntos de dados."
          createUrl="/pages/admin/datasets/new"
        />
      )}
    </div>
  );
}
