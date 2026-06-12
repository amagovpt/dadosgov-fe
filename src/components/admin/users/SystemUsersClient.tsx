"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CardNoResults, DropdownOption, DropdownSection, Icon, InputSelect } from "@ama-pt/agora-design-system";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";
import { createUserColumns, userSortFieldMap, type UserSortField } from "./usersListConfig";
import { fetchUsers } from "@/service/api/users";
import { UserAdmin } from "@/service/types/identity";

export default function SystemUsersClient() {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    handleSearch,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    sortParam,
    getSortOrder: getSharedSortOrder,
    filters,
    updateFilter,
  } = useAdminListController<UserSortField, { profileFilter: string }>({
    initialFilters: { profileFilter: "" },
    sortFieldMap: userSortFieldMap,
  });

  const columns = useMemo(() => createUserColumns(), []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchUsers(
        currentPage,
        searchQuery.trim() || undefined,
        sortParam,
        pageSize,
        filters.profileFilter || undefined
      );
      setUsers(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, sortParam, filters.profileFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSort = (field: UserSortField) => (newOrder: SortOrder) => {
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
      setSortField(newOrder === "none" ? null : field);
      setSortOrder(newOrder);
    }
    setCurrentPage(1);
  };

  const getSortOrder = (field: UserSortField): SortOrder =>
    field === "name" ? (sortField === field ? sortOrder : "none") : getSharedSortOrder(field);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Utilizadores", url: "/pages/admin/system/users" },
      ]}
      title="Utilizadores"
      isLoading={isLoading}
      count={totalItems}
      hasItems={users.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome do utilizador",
        ariaLabel: "Pesquisar utilizadores",
        onChange: handleSearch,
      }}
      filters={
        <InputSelect
          label=""
          hideLabel
          placeholder="Filtrar por perfil"
          id="filter-profile"
          onChange={(options) => {
            updateFilter("profileFilter", options.length > 0 ? (options[0].value as string) : "");
          }}
        >
          <DropdownSection name="profile">
            <DropdownOption value="" selected={filters.profileFilter === ""}>
              Todos
            </DropdownOption>
            <DropdownOption value="admin" selected={filters.profileFilter === "admin"}>
              Admin
            </DropdownOption>
            <DropdownOption value="editor" selected={filters.profileFilter === "editor"}>
              Editor
            </DropdownOption>
          </DropdownSection>
        </InputSelect>
      }
      emptyState={
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-user" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem utilizadores"
          description="Nenhum utilizador encontrado."
          hasAnchor={false}
        />
      }
    >
      <AdminListTable
        items={users}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(user) => user.id}
      />
    </AdminListPage>
  );
}

