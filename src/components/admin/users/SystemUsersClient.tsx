"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CardNoResults,
  DropdownOption,
  DropdownSection,
  Icon,
  InputSelect,
} from "@ama-pt/agora-design-system";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";
import { createUserColumns, userSortFieldMap, type UserSortField } from "./usersListConfig";
import { fetchUsers } from "@/service/api/users";
import { UserAdmin } from "@/service/types/identity";
import type { BoUsersPage } from "@/service/types/admin/users";

interface SystemUsersClientProps {
  pageContent: BoUsersPage;
}

export default function SystemUsersClient({ pageContent }: SystemUsersClientProps) {
  const { t } = useTranslation(["admin-common", "admin-users"]);
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

  const columns = useMemo(
    () =>
      createUserColumns({
        name: t("admin-users:columns.name"),
        createdAt: t("admin-users:columns.createdAt"),
        datasets: t("admin-users:columns.datasets"),
        reuses: t("admin-users:columns.reuses"),
        followers: t("admin-users:columns.followers"),
        profile: t("admin-users:columns.profile"),
        profileAdmin: t("admin-users:list.filterAdmin"),
        profileEditor: t("admin-users:list.filterEditor"),
      }),
    [t]
  );

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const response = await fetchUsers(
          currentPage,
          searchQuery.trim() || undefined,
          sortParam,
          pageSize,
          filters.profileFilter || undefined
        );
        if (!isActive) return;
        setUsers(response.data || []);
        setTotalItems(response.total || 0);
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading users:", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isActive = false;
    };
  }, [currentPage, pageSize, searchQuery, sortParam, filters.profileFilter]);

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
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        { label: t("admin-users:title"), url: "/admin/system/users" },
      ]}
      title={pageContent.systemHero?.title ?? ""}
      isLoading={isLoading}
      count={totalItems}
      hasItems={users.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        label: pageContent.search?.label,
        placeholder: pageContent.search?.placeholder ?? "",
        ariaLabel: pageContent.search?.label,
        onChange: handleSearch,
      }}
      filters={
        <InputSelect
          label=""
          hideLabel
          placeholder={t("admin-users:list.filterPlaceholder")}
          id="filter-profile"
          onChange={(options) => {
            updateFilter("profileFilter", options.length > 0 ? (options[0].value as string) : "");
          }}
        >
          <DropdownSection name="profile">
            <DropdownOption value="" selected={filters.profileFilter === ""}>
              {t("admin-users:list.filterAll")}
            </DropdownOption>
            <DropdownOption value="admin" selected={filters.profileFilter === "admin"}>
              {t("admin-users:list.filterAdmin")}
            </DropdownOption>
            <DropdownOption value="editor" selected={filters.profileFilter === "editor"}>
              {t("admin-users:list.filterEditor")}
            </DropdownOption>
          </DropdownSection>
        </InputSelect>
      }
      emptyState={
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-user" className="icon-xl h-12 w-12 text-primary-500" />}
          title={pageContent.systemNoResults?.title ?? ""}
          description={pageContent.systemNoResults?.description ?? ""}
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
