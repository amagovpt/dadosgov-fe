"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CardNoResults,
  DropdownOption,
  DropdownSection,
  Icon,
  InputSearchBar,
  InputSelect,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import { createPaginationProps } from "@/utils/createPaginationProps";
import { fetchUsers } from "@/service/api/users";
import { UserAdmin } from "@/service/types/identity";
import TextLink from "@/components/Primitives/TextLink";
import ResultsCount from "../ResultsCount";
import TableActionsCell from "../TableActionsCell";

type SortField = "name" | "created_at" | "datasets" | "reuses" | "followers";
type SortOrder = "ascending" | "descending" | "none";

const SORT_FIELD_MAP: Record<SortField, string> = {
  name: "first_name",
  created_at: "created",
  datasets: "datasets",
  reuses: "reuses",
  followers: "followers",
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const getUserProfile = (user: UserAdmin): string => {
  if (user.roles?.includes("admin")) return "Admin";
  return "Editor";
};

export default function SystemUsersClient() {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [profileFilter, setProfileFilter] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiSort = sortField ? SORT_FIELD_MAP[sortField] : undefined;
      const sortParam =
        sortOrder === "none" || !apiSort
          ? undefined
          : `${sortOrder === "descending" ? "-" : ""}${apiSort}`;

      const response = await fetchUsers(
        currentPage,
        searchQuery.trim() || undefined,
        sortParam,
        pageSize,
        profileFilter || undefined
      );
      setUsers(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, sortField, sortOrder, profileFilter]);

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

  const handleSort = (field: SortField) => (_newOrder: SortOrder) => {
    if (field === "name") {
      if (sortField !== "name") {
        setSortField("name");
        setSortOrder("descending");
      } else if (sortOrder === "descending") {
        setSortOrder("ascending");
      } else {
        setSortOrder("descending");
      }
    } else {
      setSortField(_newOrder === "none" ? null : field);
      setSortOrder(_newOrder);
    }
    setCurrentPage(1);
  };

  const getSortOrder = (field: SortField): SortOrder => {
    return sortField === field ? sortOrder : "none";
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Utilizadores", url: "/pages/admin/system/users" },
      ]}
      title="Utilizadores"
    >

      <ResultsCount count={totalItems} isLoading={isLoading} />

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome do utilizador"
            aria-label="Pesquisar utilizadores"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleSearch(e.target.value);
            }}
          />
        </div>
        <InputSelect
          label=""
          hideLabel
          placeholder="Filtrar por perfil"
          id="filter-profile"
          onChange={(options) => {
            setProfileFilter(options.length > 0 ? (options[0].value as string) : "");
            setCurrentPage(1);
          }}
        >
          <DropdownSection name="profile">
            <DropdownOption value="" selected={profileFilter === ""}>
              Todos
            </DropdownOption>
            <DropdownOption value="admin" selected={profileFilter === "admin"}>
              Admin
            </DropdownOption>
            <DropdownOption value="editor" selected={profileFilter === "editor"}>
              Editor
            </DropdownOption>
          </DropdownSection>
        </InputSelect>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-700">A carregar...</p>
      ) : users.length > 0 ? (
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
                sortType="numeric"
                sortOrder={getSortOrder("name")}
                onSortChange={handleSort("name")}
              >
                Nome
              </TableHeaderCell>
              <TableHeaderCell
                sortType="numeric"
                sortOrder={getSortOrder("created_at")}
                onSortChange={handleSort("created_at")}
              >
                Criado em
              </TableHeaderCell>
              <TableHeaderCell
                sortType="numeric"
                sortOrder={getSortOrder("datasets")}
                onSortChange={handleSort("datasets")}
              >
                Conjuntos de dados
              </TableHeaderCell>
              <TableHeaderCell
                sortType="numeric"
                sortOrder={getSortOrder("reuses")}
                onSortChange={handleSort("reuses")}
              >
                Reutilizações
              </TableHeaderCell>
              <TableHeaderCell
                sortType="numeric"
                sortOrder={getSortOrder("followers")}
                onSortChange={handleSort("followers")}
              >
                Seguidores
              </TableHeaderCell>
              <TableHeaderCell>Perfis</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell headerLabel="Nome">
                  <div>
                    <TextLink href={`/pages/users/${user.slug}`}>
                      {user.first_name} {user.last_name}
                    </TextLink>
                    {user.email && (
                      <div className="text-sm flex items-center gap-4 text-neutral-900">
                        <Icon name="agora-line-mail" className="h-[14px] w-[14px]" />
                        {user.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell headerLabel="Criado em">{formatDate(user.since)}</TableCell>
                <TableCell headerLabel="Conjuntos de dados">{user.datasets_count ?? 0}</TableCell>
                <TableCell headerLabel="Reutilizações">{user.reuses_count ?? 0}</TableCell>
                <TableCell headerLabel="Seguidores">{user.metrics?.followers ?? 0}</TableCell>
                <TableCell headerLabel="Perfis">{getUserProfile(user)}</TableCell>
                <TableCell headerLabel="Ações">
                  <TableActionsCell
                    viewAction={{
                      href: `/pages/users/${user.slug}`,
                    }}
                    editAction={{
                      href: `/pages/admin/users/${user.id}/profile`,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-user" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem utilizadores"
          description="Nenhum utilizador encontrado."
          hasAnchor={false}
        />
      )}
    </AdminLayout>
  );
}
