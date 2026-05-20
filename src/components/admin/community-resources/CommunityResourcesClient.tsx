"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchMyCommunityResources } from "@/api/community-resources/route";
import { CommunityResource } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";

type SortOrder = "none" | "ascending" | "descending";
type SortField = "title" | "format" | "created_at" | "last_modified";

export default function CommunityResourcesClient() {
  const { displayName } = useCurrentUser();
  const router = useRouter();

  const [allResources, setAllResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadResources() {
      setIsLoading(true);
      try {
        const response = await fetchMyCommunityResources(1, 9999);
        setAllResources(response.data || []);
      } catch (error) {
        console.error("Error loading community resources:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadResources();
  }, []);

  const filteredResources = useMemo(() => {
    let result = allResources;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.format && r.format.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allResources, searchQuery]);

  const sortedResources = useMemo(() => {
    if (sortOrder === "none") return filteredResources;

    return [...filteredResources].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "format":
          cmp = (a.format || "").localeCompare(b.format || "");
          break;
        case "created_at":
          cmp =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
        case "last_modified":
          cmp =
            new Date(a.last_modified).getTime() -
            new Date(b.last_modified).getTime();
          break;
      }
      return sortOrder === "descending" ? -cmp : cmp;
    });
  }, [filteredResources, sortField, sortOrder]);

  const totalItems = sortedResources.length;
  const start = (currentPage - 1) * pageSize;
  const resources = sortedResources.slice(start, start + pageSize);

  const handleSort = (field: SortField) => (newOrder: SortOrder) => {
    setSortField(field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: SortField): SortOrder => {
    return sortField === field ? sortOrder : "none";
  };

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: displayName || "...", url: "#" },
            { label: "Recursos comunitários", url: "/pages/admin/me/community-resources" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Recursos comunitários</h1>
        <PublishDropdown />
      </div>

      <p className="text-neutral-700 text-sm mb-16">
        {isLoading ? "A carregar..." : `${totalItems} resultados`}
      </p>

      <div className="flex items-end gap-16 mb-24">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquisar recursos comunitários"
            aria-label="Pesquisar recursos comunitários"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {!isLoading && resources.length > 0 ? (
        <Table
          paginationProps={{
            itemsPerPageLabel: "Itens por página",
            itemsPerPage: pageSize,
            totalItems: totalItems,
            availablePageSizes: [5, 10, 20],
            currentPage: currentPage - 1,
            buttonDropdownAriaLabel: "Selecionar itens por página",
            dropdownListAriaLabel: "Opções de itens por página",
            prevButtonAriaLabel: "Página anterior",
            nextButtonAriaLabel: "Próxima página",
            onPageChange: (page: number) => setCurrentPage(page + 1),
            onPageSizeChange: (size: number) => {
              setPageSize(size);
              setCurrentPage(1);
            },
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderCell
                sortType="date"
                sortOrder={getSortOrder("title")}
                onSortChange={handleSort("title")}
              >
                Título
              </TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell
                sortType="date"
                sortOrder={getSortOrder("format")}
                onSortChange={handleSort("format")}
              >
                Formato
              </TableHeaderCell>
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
                Modificado em
              </TableHeaderCell>
              <TableHeaderCell>Ação</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell headerLabel="Título">
                  <span className="text-neutral-900">{resource.title}</span>
                  {resource.dataset && (
                    <>
                      <br />
                      <a
                        href={`/pages/datasets/${resource.dataset.id}`}
                        className="text-primary-600 underline text-sm"
                      >
                        {resource.dataset.title}
                      </a>
                    </>
                  )}
                </TableCell>
                <TableCell headerLabel="Estado">
                  {resource.deleted ? (
                    <StatusDot variant="danger">Excluído</StatusDot>
                  ) : resource.archived ? (
                    <StatusDot variant="neutral">Arquivado</StatusDot>
                  ) : (
                    <StatusDot variant="success">Público</StatusDot>
                  )}
                </TableCell>
                <TableCell headerLabel="Formato">
                  {resource.format || "—"}
                </TableCell>
                <TableCell headerLabel="Criado em">
                  {formatDateToDMY(resource.created_at)}
                </TableCell>
                <TableCell headerLabel="Modificado em">
                  {formatDateToDMY(resource.last_modified)}
                </TableCell>
                <TableCell headerLabel="Ação">
                  <a href={`/pages/admin/me/community-resources/edit?id=${resource.id}`}>
                    <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <Icon
                  name="agora-line-user-group"
                  className="w-12 h-12 text-primary-500 icon-xl"
                />
              }
              title="Sem publicações"
              description="Ainda não publicou um recurso comunitário."
              hasAnchor={false}
              extraDescription={
                <div className="mt-24">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => router.push("/pages/admin/community-resources/new")}
                  >
                    Publique no portal
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
