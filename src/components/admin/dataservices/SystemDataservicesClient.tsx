"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CardNoResults,
  Icon,
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import { fetchDataservices } from "@/service/api/dataservices";
import { Dataservice } from "@/service/types/dataservice";
import AdminLayout from "@/components/Layout/AdminLayout";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";
import { filterByStatus } from "@/utils/filterByStatus";
import ResultsCount from "../ResultsCount";
import StatusFilterSelect from "../StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";

type SortOrder = "none" | "ascending" | "descending";
type DataserviceSortField = "title" | "created_at" | "last_modified";

const SORT_FIELD_MAP: Record<DataserviceSortField, string> = {
  title: "title",
  created_at: "created",
  last_modified: "last_modified",
};

export default function SystemDataservicesClient() {
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);
  const [apis, setApis] = useState<Dataservice[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<DataserviceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortParam = useMemo(() => {
    if (!sortField || sortOrder === "none") return undefined;
    const apiField = SORT_FIELD_MAP[sortField];
    return `${sortOrder === "descending" ? "-" : ""}${apiField}`;
  }, [sortField, sortOrder]);

  const handleSort = (field: DataserviceSortField) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: DataserviceSortField): SortOrder =>
    sortField === field ? sortOrder : "none";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchDataservices(currentPage, pageSize, {
        q: searchQuery.trim() || undefined,
        sort: sortParam,
      });
      setApis(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading dataservices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, sortParam]);

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

  const filteredApis = useMemo(() => filterByStatus(apis, statusFilter), [apis, statusFilter]);
  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        { label: t("admin-dataservices:title"), url: "/admin/system/dataservices" },
      ]}
      title={t("admin-dataservices:title")}
    >

      <ResultsCount count={totalItems} isLoading={isLoading} />

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label={t("admin-common:search.label")}
            placeholder={t("admin-dataservices:search.placeholder")}
            aria-label={t("admin-dataservices:search.ariaLabel")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleSearch(e.target.value);
            }}
          />
        </div>
        <StatusFilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-700">{t("admin-common:loading")}</p>
      ) : filteredApis.length > 0 ? (
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
                sortOrder={getSortOrder("title")}
                onSortChange={handleSort("title")}
              >
                {t("admin-dataservices:columns.title")}
              </TableHeaderCell>
              <TableHeaderCell>{t("admin-dataservices:columns.status")}</TableHeaderCell>
              <TableHeaderCell
                sortType="date"
                sortOrder={getSortOrder("created_at")}
                onSortChange={handleSort("created_at")}
              >
                {t("admin-dataservices:columns.createdAt")}
              </TableHeaderCell>
              <TableHeaderCell
                sortType="date"
                sortOrder={getSortOrder("last_modified")}
                onSortChange={handleSort("last_modified")}
              >
                {t("admin-dataservices:columns.modifiedAt")}
              </TableHeaderCell>
              <TableHeaderCell>{t("admin-dataservices:columns.actions")}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApis.map((api) => (
              <TableRow key={api.id}>
                <TableCell headerLabel={t("admin-dataservices:columns.titleShort")}>
                  <TextLink href={`/dataservices/${api.slug}`}>{api.title}</TextLink>
                </TableCell>
                <TableCell headerLabel={t("admin-dataservices:columns.status")}>
                  <ResourceStatusBadge item={api} />
                </TableCell>
                <TableCell headerLabel={t("admin-dataservices:columns.createdAt")}>
                  {formatDateToDMY(api.created_at)}
                </TableCell>
                <TableCell headerLabel={t("admin-dataservices:columns.modifiedAt")}>
                  {formatDateToDMY(api.metadata_modified_at || api.last_modified)}
                  {(api.owner || api.organization) && (
                    <>
                      <br />
                      <span className="text-sm text-neutral-500">
                        {t("admin-dataservices:columns.by")}{" "}
                        {api.owner
                          ? `${api.owner.first_name} ${api.owner.last_name}`
                          : api.organization?.name}
                      </span>
                    </>
                  )}
                </TableCell>
                <TableCell headerLabel={t("admin-dataservices:columns.actions")}>
                  <TableActionsCell
                    viewAction={{
                      href: `/dataservices/${api.slug}`,
                    }}
                    editAction={{
                      href: `/admin/dataservices/edit?slug=${api.slug}`,
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
          icon={<Icon name="agora-line-code" className="icon-xl h-12 w-12 text-primary-500" />}
          title={t("admin-dataservices:empty.title")}
          description={t("admin-dataservices:empty.description")}
          hasAnchor={false}
        />
      )}
    </AdminLayout>
  );
}
