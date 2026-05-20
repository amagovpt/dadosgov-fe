"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  Button,
  CardNoResults,
  Icon,
  InputSearchBar,
  InputSelect,
  DropdownSection,
  DropdownOption,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { createPaginationProps } from "@/utils/createPaginationProps";
import { fetchAdminPosts } from "@/services/api";
import { Post } from "@/types/api";

type SortOrder = "none" | "ascending" | "descending";
type SortField = "name" | "created_at" | "last_modified";

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function SystemPostsClient() {
  const FETCH_PAGE_SIZE = 100;
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const firstResponse = await fetchAdminPosts(1, FETCH_PAGE_SIZE);
      let data = firstResponse.data || [];
      const totalAvailable = firstResponse.total || data.length;
      const totalPages = Math.ceil(totalAvailable / FETCH_PAGE_SIZE);

      if (totalPages > 1) {
        const remainingResponses = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchAdminPosts(index + 2, FETCH_PAGE_SIZE)
          )
        );
        data = data.concat(remainingResponses.flatMap((res) => res.data || []));
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        data = data.filter((p) => p.name.toLowerCase().includes(q));
      }
      if (typeFilter) {
        data = data.filter((p) => {
          if (typeFilter === "news") return p.kind !== "page";
          if (typeFilter === "page") return p.kind === "page";
          return true;
        });
      }
      if (statusFilter) {
        data = data.filter((p) => {
          if (statusFilter === "published") return !!p.published;
          if (statusFilter === "draft") return !p.published;
          return true;
        });
      }
      if (sortField && sortOrder !== "none") {
        data = [...data].sort((a, b) => {
          if (sortField === "name") {
            const cmp = (a.name || "").localeCompare(b.name || "", "pt", { sensitivity: "base" });
            return sortOrder === "descending" ? -cmp : cmp;
          }
          const aTime = new Date(a[sortField] || "").getTime();
          const bTime = new Date(b[sortField] || "").getTime();
          const cmp = aTime - bTime;
          return sortOrder === "descending" ? -cmp : cmp;
        });
      }
      const start = (currentPage - 1) * pageSize;
      const pagedData = data.slice(start, start + pageSize);

      setPosts(pagedData);
      setTotalItems(data.length);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, typeFilter, statusFilter, sortField, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 400);
  };

  const handleSort = (field: SortField) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
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
            { label: "Sistema", url: "#" },
            { label: "Artigos", url: "/pages/admin/system/posts" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Artigos</h1>
        <PublishDropdown />
      </div>

      <p className="text-neutral-700 text-sm mb-16">
        {totalItems} resultados
      </p>

      <div className="flex items-end gap-16 mb-24">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o título do artigo"
            aria-label="Pesquisar artigos"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleSearch(e.target.value);
            }}
          />
        </div>
        <InputSelect
          label=""
          hideLabel
          placeholder="Filtrar por tipo"
          id="filter-type"
          onChange={(options) => {
            setTypeFilter(
              options.length > 0 ? (options[0].value as string) : ""
            );
            setCurrentPage(1);
          }}
        >
          <DropdownSection name="type">
            <DropdownOption value="" selected={typeFilter === ""}>Todos</DropdownOption>
            <DropdownOption value="news" selected={typeFilter === "news"}>Notícias</DropdownOption>
            <DropdownOption value="page" selected={typeFilter === "page"}>Página</DropdownOption>
          </DropdownSection>
        </InputSelect>
        <InputSelect
          label=""
          hideLabel
          placeholder="Filtrar por estado"
          id="filter-status"
          onChange={(options) => {
            setStatusFilter(
              options.length > 0 ? (options[0].value as string) : ""
            );
            setCurrentPage(1);
          }}
        >
          <DropdownSection name="status">
            <DropdownOption value="" selected={statusFilter === ""}>Todos</DropdownOption>
            <DropdownOption value="published" selected={statusFilter === "published"}>Publicado</DropdownOption>
            <DropdownOption value="draft" selected={statusFilter === "draft"}>Despublicado</DropdownOption>
          </DropdownSection>
        </InputSelect>
        <Button
          variant="primary"
          appearance="outline"
          hasIcon={true}
          leadingIcon="agora-line-plus-circle"
          leadingIconHover="agora-solid-plus-circle"
          onClick={() => router.push("/pages/admin/system/posts/new")}
        >
          Criar um artigo
        </Button>
      </div>

      {isLoading ? (
        <p className="text-neutral-700 text-sm">A carregar...</p>
      ) : posts.length > 0 ? (
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
                sortType="string"
                sortOrder={getSortOrder("name")}
                onSortChange={handleSort("name")}
              >
                Título
              </TableHeaderCell>
              <TableHeaderCell>Tipo</TableHeaderCell>
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
                Atualizado em
              </TableHeaderCell>
              <TableHeaderCell>Ação</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell headerLabel="Título">
                  <a
                    href={`/pages/posts/${post.slug}`}
                    className="text-primary-600 underline"
                  >
                    {post.name}
                  </a>
                </TableCell>
                <TableCell headerLabel="Tipo">
                  {post.kind === "page" ? "Página" : "Notícias"}
                </TableCell>
                <TableCell headerLabel="Estado">
                  <StatusDot variant={post.published ? "success" : "warning"}>
                    {post.published ? "Publicado" : "Despublicado"}
                  </StatusDot>
                </TableCell>
                <TableCell headerLabel="Criado em">
                  {formatDate(post.created_at)}
                </TableCell>
                <TableCell headerLabel="Atualizado em">
                  {formatDate(post.last_modified)}
                </TableCell>
                <TableCell headerLabel="Ação">
                  <div className="flex gap-8">
                    <a href={`/pages/posts/${post.slug}`}>
                      <Icon name="agora-line-eye" className="w-[20px] h-[20px]" />
                    </a>
                    <a href={`/pages/admin/posts/${post.id}`}>
                      <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <CardNoResults
          position="center"
          icon={
            <Icon
              name="agora-line-edit"
              className="w-12 h-12 text-primary-500 icon-xl"
            />
          }
          title="Sem artigos"
          description="Nenhum artigo encontrado."
          hasAnchor={false}
        />
      )}
    </div>
  );
}

