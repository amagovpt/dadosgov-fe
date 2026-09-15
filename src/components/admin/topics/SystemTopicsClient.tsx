"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, CardNoResults, Icon, InputSelect } from "@ama-pt/agora-design-system";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import IsolatedInput from "@/components/admin/IsolatedInput";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import DropdownSection from "@/components/Primitives/Dropdown/DropdownSection";
import DropdownOption from "@/components/Primitives/Dropdown/DropdownOption";
import {
  createTopicColumns,
  topicSortFieldMap,
  type TopicSortField,
} from "./topicsListConfig";
import { fetchTopics } from "@/service/api/discussions-topics";
import { Topic } from "@/service/types/topic";
import type { BoTopicsPage } from "@/service/types/admin/topics";

interface SystemTopicsClientProps {
  pageContent: BoTopicsPage;
}

export default function SystemTopicsClient({ pageContent }: SystemTopicsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-topics"]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    handleSearch,
    sortParam,
    getSortOrder,
    handleSort,
    filters,
    updateFilter,
    setFilters,
  } = useAdminListController<
    TopicSortField,
    {
      private: string;
      tag: string;
      geozone: string;
      granularity: string;
      organization: string;
      owner: string;
      featured: string;
    }
  >({
    initialFilters: {
      private: "",
      tag: "",
      geozone: "",
      granularity: "",
      organization: "",
      owner: "",
      featured: "",
    },
    sortFieldMap: topicSortFieldMap,
  });

  const handleTagFilter = useDebouncedSearch((value) => updateFilter("tag", value), 400);
  const handleGeozoneFilter = useDebouncedSearch((value) => updateFilter("geozone", value), 400);
  const handleGranularityFilter = useDebouncedSearch(
    (value) => updateFilter("granularity", value),
    400
  );
  const handleOrganizationFilter = useDebouncedSearch(
    (value) => updateFilter("organization", value),
    400
  );
  const handleOwnerFilter = useDebouncedSearch((value) => updateFilter("owner", value), 400);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const response = await fetchTopics(currentPage, pageSize, {
          q: searchQuery.trim() || undefined,
          private: filters.private === "" ? undefined : filters.private === "true",
          tag: filters.tag
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          geozone: filters.geozone.trim() || undefined,
          granularity: filters.granularity.trim() || undefined,
          organization: filters.organization.trim() || undefined,
          owner: filters.owner.trim() || undefined,
          featured: filters.featured === "" ? undefined : filters.featured === "true",
          sort: sortParam,
        });
        if (!isActive) return;
        setTopics(response.data || []);
        setTotalItems(response.total || 0);
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading topics:", error);
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
  }, [
    currentPage,
    filters.featured,
    filters.geozone,
    filters.granularity,
    filters.organization,
    filters.owner,
    filters.private,
    filters.tag,
    pageSize,
    searchQuery,
    sortParam,
  ]);

  const columns = useMemo(
    () =>
      createTopicColumns({
        name: t("admin-topics:columns.name"),
        createdAt: t("admin-topics:columns.createdAt"),
        datasets: t("admin-topics:columns.datasets"),
        reuses: t("admin-topics:columns.reuses"),
      }),
    [t]
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        { label: t("admin-topics:title"), url: "/admin/system/topics" },
      ]}
      title={pageContent.systemHero?.title ?? ""}
      isLoading={isLoading}
      count={totalItems}
      hasItems={topics.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        label: t("admin-topics:filters.search.label"),
        placeholder: t("admin-topics:filters.search.placeholder"),
        ariaLabel: t("admin-topics:filters.search.label"),
        onChange: handleSearch,
      }}
      toolbarActions={
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => setShowFilters((visible) => !visible)}
          aria-expanded={showFilters}
          aria-controls="topic-filters"
        >
          {t("admin-topics:filters.button")}
        </Button>
      }
      feedback={
        showFilters ? (
          <section
            id="topic-filters"
            aria-label={t("admin-topics:filters.button")}
            className="mb-24 grid grid-cols-1 gap-16 md:grid-cols-2 xl:grid-cols-3"
          >
            <InputSelect
              id="topic-filter-private"
              label={t("admin-topics:filters.private.label")}
              placeholder={t("admin-topics:filters.private.placeholder")}
              onChange={(options) =>
                updateFilter("private", options.length > 0 ? String(options[0].value) : "")
              }
            >
              <DropdownSection name="private">
                <DropdownOption value="" selected={filters.private === ""}>
                  {t("admin-topics:filters.all")}
                </DropdownOption>
                <DropdownOption value="false" selected={filters.private === "false"}>
                  {t("admin-topics:filters.private.public")}
                </DropdownOption>
                <DropdownOption value="true" selected={filters.private === "true"}>
                  {t("admin-topics:filters.private.private")}
                </DropdownOption>
              </DropdownSection>
            </InputSelect>
            <InputSelect
              id="topic-filter-featured"
              label={t("admin-topics:filters.featured.label")}
              placeholder={t("admin-topics:filters.featured.placeholder")}
              onChange={(options) =>
                updateFilter("featured", options.length > 0 ? String(options[0].value) : "")
              }
            >
              <DropdownSection name="featured">
                <DropdownOption value="" selected={filters.featured === ""}>
                  {t("admin-topics:filters.all")}
                </DropdownOption>
                <DropdownOption value="true" selected={filters.featured === "true"}>
                  {t("admin-topics:filters.featured.featured")}
                </DropdownOption>
                <DropdownOption value="false" selected={filters.featured === "false"}>
                  {t("admin-topics:filters.featured.notFeatured")}
                </DropdownOption>
              </DropdownSection>
            </InputSelect>
            <IsolatedInput
              id="topic-filter-tag"
              label={t("admin-topics:filters.tag.label")}
              placeholder={t("admin-topics:filters.tag.placeholder")}
              defaultValue={filters.tag}
              onChange={handleTagFilter}
            />
            <IsolatedInput
              id="topic-filter-geozone"
              label={t("admin-topics:filters.geozone.label")}
              placeholder={t("admin-topics:filters.geozone.placeholder")}
              defaultValue={filters.geozone}
              onChange={handleGeozoneFilter}
            />
            <IsolatedInput
              id="topic-filter-granularity"
              label={t("admin-topics:filters.granularity.label")}
              placeholder={t("admin-topics:filters.granularity.placeholder")}
              defaultValue={filters.granularity}
              onChange={handleGranularityFilter}
            />
            <IsolatedInput
              id="topic-filter-organization"
              label={t("admin-topics:filters.organization.label")}
              placeholder={t("admin-topics:filters.organization.placeholder")}
              defaultValue={filters.organization}
              onChange={handleOrganizationFilter}
            />
            <IsolatedInput
              id="topic-filter-owner"
              label={t("admin-topics:filters.owner.label")}
              placeholder={t("admin-topics:filters.owner.placeholder")}
              defaultValue={filters.owner}
              onChange={handleOwnerFilter}
            />
            <div className="flex items-end">
              <Button
                variant="primary"
                appearance="outline"
                onClick={() => {
                  setFilters({
                    private: "",
                    tag: "",
                    geozone: "",
                    granularity: "",
                    organization: "",
                    owner: "",
                    featured: "",
                  });
                }}
              >
                {t("admin-topics:filters.clear")}
              </Button>
            </div>
          </section>
        ) : undefined
      }
      emptyState={
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-tag" className="icon-xl h-12 w-12 text-primary-500" />}
          title={pageContent.systemNoResults?.title ?? ""}
          description={pageContent.systemNoResults?.description ?? ""}
          hasAnchor={false}
        />
      }
    >
      <AdminListTable
        items={topics}
        columns={columns}
        getRowKey={(topic) => topic.id}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
      />
    </AdminListPage>
  );
}
