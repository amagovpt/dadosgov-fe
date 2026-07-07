"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import { fetchMyDataservices } from "@/service/api/dataservices";
import { Dataservice } from "@/service/types/dataservice";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminLayout from "@/components/Layout/AdminLayout";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";
import { filterByStatus } from "@/utils/filterByStatus";
import AdminEmptyState from "../AdminEmptyState";
import ResultsCount from "../ResultsCount";
import TableActionsCell from "../TableActionsCell";

type SortOrder = "none" | "ascending" | "descending";
type DataserviceSortField = "title" | "created_at" | "last_modified";

export default function DataservicesClient() {
  const { displayName } = useCurrentUser();
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);

  const [apis, setApis] = useState<Dataservice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<DataserviceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const handleSort = (field: DataserviceSortField) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
    setSortOrder(newOrder);
  };

  const getSortOrder = (field: DataserviceSortField): SortOrder =>
    sortField === field ? sortOrder : "none";

  const filteredApis = useMemo(() => filterByStatus(apis, statusFilter), [apis, statusFilter]);

  const sortedApis = useMemo(() => {
    if (!sortField || sortOrder === "none") return filteredApis;
    const dir = sortOrder === "ascending" ? 1 : -1;
    const collator = new Intl.Collator("pt", { sensitivity: "base" });
    return [...filteredApis].sort((a, b) => {
      if (sortField === "title") {
        return collator.compare(a.title ?? "", b.title ?? "") * dir;
      }
      const av =
        sortField === "created_at" ? a.created_at : a.metadata_modified_at || a.last_modified;
      const bv =
        sortField === "created_at" ? b.created_at : b.metadata_modified_at || b.last_modified;
      const at = av ? Date.parse(av) : 0;
      const bt = bv ? Date.parse(bv) : 0;
      return (at - bt) * dir;
    });
  }, [filteredApis, sortField, sortOrder]);

  useEffect(() => {
    async function loadDataservices() {
      setIsLoading(true);
      try {
        const response = await fetchMyDataservices(1, 9999);
        setApis(response.data || []);
      } catch (error) {
        console.error("Error loading dataservices:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDataservices();
  }, []);

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: displayName || "...", url: "#" },
        { label: t("admin-dataservices:title"), url: "/admin/dataservices" },
      ]}
      title={t("admin-dataservices:title")}
    >

      <ResultsCount count={filteredApis.length} isLoading={isLoading} />

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label={t("admin-common:search.label")}
            placeholder={t("admin-dataservices:search.placeholder")}
            aria-label={t("admin-dataservices:search.ariaLabel")}
          />
        </div>
        <StatusFilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v)} />
      </div>

      {!isLoading && filteredApis.length > 0 ? (
        <Table
          paginationProps={createPaginationProps(5, filteredApis.length, 0, undefined, undefined, {
            currentPageIsZeroBased: true,
          })}
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
            {sortedApis.map((api, index) => (
              <TableRow key={index}>
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
                  <div>
                    <div>{formatDateToDMY(api.metadata_modified_at || api.last_modified)}</div>
                    {api.owner && (
                      <TextLink href={`/users/${api.owner.slug}`} className="text-xs">
                        {api.owner.first_name} {api.owner.last_name}
                      </TextLink>
                    )}
                  </div>
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
        <AdminEmptyState icon="agora-line-edit" createUrl="/admin/dataservices/new" />
      )}
    </AdminLayout>
  );
}
