"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, InputSelect } from "@ama-pt/agora-design-system";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { buildApiSortParam, paginateItems } from "@/utils/admin-lists/listHelpers";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { fetchAdminPosts } from "@/service/api/posts";
import type { Post } from "@/service/types/posts";
import DropdownSection from "@/components/Primitives/Dropdown/DropdownSection";
import DropdownOption from "@/components/Primitives/Dropdown/DropdownOption";
import {
  createPostColumns,
  postSortFieldMap,
  sortPosts,
  type PostSortField,
} from "@/components/admin/posts/config/postsListConfig";
import type { BoPostsPage } from "@/service/types/admin/posts";

interface SystemPostsClientProps {
  pageContent: BoPostsPage;
}

export default function SystemPostsClient({ pageContent }: SystemPostsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-posts"]);
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
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
    sortOrder,
    handleSort,
    getSortOrder,
    filters,
    updateFilter,
  } = useAdminListController<PostSortField, { typeFilter: string; statusFilter: string }>({
    initialFilters: { typeFilter: "", statusFilter: "" },
  });
  const usesLocalFallback = Boolean(filters.statusFilter) || sortField === "type";
  const sortParam = useMemo(
    () =>
      usesLocalFallback
        ? undefined
        : buildApiSortParam(sortField, sortOrder, postSortFieldMap),
    [sortField, sortOrder, usesLocalFallback],
  );

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchAdminPosts(
        usesLocalFallback ? 1 : currentPage,
        usesLocalFallback ? 9999 : pageSize,
        {
          q: searchQuery.trim() || undefined,
          kind: filters.typeFilter || undefined,
          sort: sortParam,
        },
      );
      setPosts(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters.typeFilter, pageSize, searchQuery, sortParam, usesLocalFallback]);

  useEffect(() => {
    let isActive = true;
    const loadCurrentPosts = async () => {
      if (isActive) await loadPosts();
    };
    void loadCurrentPosts();
    return () => {
      isActive = false;
    };
  }, [loadPosts]);

  const filteredPosts = useMemo(
    () =>
      filters.statusFilter
        ? posts.filter((post) =>
            filters.statusFilter === "published" ? Boolean(post.published) : !post.published
          )
        : posts,
    [filters.statusFilter, posts]
  );

  const sortedPosts = useMemo(
    () => sortPosts(filteredPosts, sortField, sortOrder),
    [filteredPosts, sortField, sortOrder]
  );

  const paginatedPosts = useMemo(
    () => (usesLocalFallback ? paginateItems(sortedPosts, currentPage, pageSize) : sortedPosts),
    [currentPage, pageSize, sortedPosts, usesLocalFallback]
  );

  const columns = useMemo(
    () =>
      createPostColumns({
        title: t("admin-posts:columns.title"),
        type: t("admin-posts:columns.type"),
        news: t("admin-posts:list.news"),
        page: t("admin-posts:list.page"),
        status: t("admin-posts:columns.status"),
        published: t("admin-posts:list.published"),
        unpublished: t("admin-posts:list.unpublished"),
        createdAt: t("admin-posts:columns.createdAt"),
        updatedAt: t("admin-posts:columns.updatedAt"),
        action: t("admin-posts:columns.action"),
      }),
    [t]
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        { label: t("admin-posts:title"), url: "/admin/system/posts" },
      ]}
      title={pageContent.systemHero?.title ?? ""}
      isLoading={isLoading}
      count={usesLocalFallback ? filteredPosts.length : totalItems}
      hasItems={paginatedPosts.length > 0}
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
        <>
          <InputSelect
            label=""
            hideLabel
            placeholder={t("admin-posts:list.typePlaceholder")}
            id="filter-type"
            onChange={(options) => {
              updateFilter("typeFilter", options.length > 0 ? (options[0].value as string) : "");
            }}
          >
            <DropdownSection name="type">
              <DropdownOption value="" selected={filters.typeFilter === ""}>
                {t("admin-posts:list.all")}
              </DropdownOption>
              <DropdownOption value="news" selected={filters.typeFilter === "news"}>
                {t("admin-posts:list.news")}
              </DropdownOption>
              <DropdownOption value="page" selected={filters.typeFilter === "page"}>
                {t("admin-posts:list.page")}
              </DropdownOption>
            </DropdownSection>
          </InputSelect>
          <StatusFilterSelect
            value={filters.statusFilter}
            onChange={(value) => updateFilter("statusFilter", value)}
            options={[
              { value: "", label: t("admin-posts:list.all") },
              { value: "published", label: t("admin-posts:list.published") },
              { value: "draft", label: t("admin-posts:list.unpublished") },
            ]}
          />
        </>
      }
      toolbarActions={
        <Button
          variant="primary"
          appearance="outline"
          hasIcon
          leadingIcon="agora-line-plus-circle"
          leadingIconHover="agora-solid-plus-circle"
          onClick={() => router.push("/admin/system/posts/new")}
        >
          {t("admin-posts:list.create")}
        </Button>
      }
      emptyState={
        <AdminEmptyState
          noResults={pageContent.systemNoResults}
        />
      }
    >
      <AdminListTable
        items={paginatedPosts}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(post) => post.id}
      />
    </AdminListPage>
  );
}
