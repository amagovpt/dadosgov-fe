"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, InputSelect } from "@ama-pt/agora-design-system";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminSquidexEmptyState from "@/components/admin/lists/AdminSquidexEmptyState";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { fetchAdminPosts } from "@/service/api/posts";
import type { Post } from "@/service/types/posts";
import DropdownSection from "@/components/Primitives/Dropdown/DropdownSection";
import DropdownOption from "@/components/Primitives/Dropdown/DropdownOption";
import {
  createPostColumns,
  filterPosts,
  sortPosts,
  type PostSortField,
} from "@/components/admin/posts/config/postsListConfig";
import type { BoPostsPage } from "@/service/types/admin/posts";

interface SystemPostsClientProps {
  pageContent: BoPostsPage;
}

export default function SystemPostsClient({ pageContent }: SystemPostsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-posts"]);
  const fetchPageSize = 100;
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
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

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const firstResponse = await fetchAdminPosts(1, fetchPageSize);
        let data = firstResponse.data || [];
        const totalAvailable = firstResponse.total || data.length;
        const totalPages = Math.ceil(totalAvailable / fetchPageSize);

        if (totalPages > 1) {
          const remainingResponses = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              fetchAdminPosts(index + 2, fetchPageSize)
            )
          );
          data = data.concat(remainingResponses.flatMap((response) => response.data || []));
        }

        if (!isActive) return;
        setAllPosts(data);
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading posts:", error);
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
  }, [fetchPageSize]);

  const filteredPosts = useMemo(
    () => filterPosts(allPosts, searchQuery, filters.typeFilter, filters.statusFilter),
    [allPosts, searchQuery, filters.typeFilter, filters.statusFilter]
  );

  const sortedPosts = useMemo(
    () => sortPosts(filteredPosts, sortField, sortOrder),
    [filteredPosts, sortField, sortOrder]
  );

  const paginatedPosts = useMemo(
    () => paginateItems(sortedPosts, currentPage, pageSize),
    [sortedPosts, currentPage, pageSize]
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
      count={sortedPosts.length}
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
        <AdminSquidexEmptyState
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
