"use client";

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  InputSearchBar,
  Pill,
  StatusCard,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableSelectionCell,
  TableSelectionHeaderCell,
  Toggle,
  ToggleGroup,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import { ResourceItem } from "@/components/admin/FileUploadModal/ResourceItem";
import { getFileExtension, formatFileSize } from "@/components/admin/FileUploadModal/utils";
import DatasetsEditResourceDetailPopup from "@/components/admin/datasets/resource-dialogs/DatasetsEditResourceDetailPopup";
import DatasetsEditResourceEditPopup from "@/components/admin/datasets/resource-dialogs/DatasetsEditResourceEditPopup";
import DeleteResourcePopup from "@/components/admin/datasets/resource-dialogs/DeleteResourcePopup";
import { fetchDataset } from "@/service/api/datasets";
import type { Resource } from "@/service/types/dataset";
import type { Dispatch, SetStateAction } from "react";
import type { ResourceType } from "@/service/types/catalog";
import type { PendingResourceMeta } from "@/components/admin/FileUploadModal/types";

interface PendingResources {
  uploadedFiles: File[];
  resourceUrls: string[];
  resourceMetadata: Record<string, PendingResourceMeta>;
  setUploadedFiles: Dispatch<SetStateAction<File[]>>;
  setResourceUrls: Dispatch<SetStateAction<string[]>>;
  onEditMeta: (key: string, meta: PendingResourceMeta, newUrl?: string) => void;
  onEditResource?: (item: File | string) => void;
}

interface DatasetResourcesTableProps {
  savedResources?: Resource[];
  resourceTypes: ResourceType[];
  datasetId?: string;
  onResourcesChange?: (resources: Resource[]) => void;
  onResourceClick?: (resource: Resource) => void;
  selectable?: boolean;
  pending?: PendingResources;
}

type Availability = "available" | "unavailable" | "unknown";
type Row = {
  key: string;
  title: string;
  type: string;
  format: string;
  date?: string;
  availability: Availability;
  resource?: Resource;
  file?: File;
  url?: string;
  index?: number;
};

export function DatasetResourcesTable(props: DatasetResourcesTableProps) {
  const tableId = useId();
  const selectable = props.selectable !== false;
  const { t, i18n } = useTranslation("admin-datasets");
  const { show, hide } = usePopupContext();
  const [query, setQuery] = useState("");
  const [refreshError, setRefreshError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sort, setSort] = useState<{
    field: "title" | "date";
    order: "none" | "ascending" | "descending";
  }>({ field: "title", order: "none" });
  const rows: Row[] = (props.savedResources ?? []).map((resource) => ({
    key: resource.id,
    title: resource.title,
    type: resource.type || "main",
    format: resource.format,
    date: resource.last_modified || resource.created_at,
    resource,
    availability:
      resource.extras?.["check:available"] === true
        ? "available"
        : resource.extras?.["check:available"] === false
          ? "unavailable"
          : "unknown",
  }));
  props.pending?.uploadedFiles.forEach((file, index) => {
    const key = `file-${file.name}`,
      meta = props.pending!.resourceMetadata[key];
    rows.push({
      key,
      title: meta?.title || file.name,
      type: meta?.resourceType || "main",
      format: meta?.format || getFileExtension(file.name, false).slice(1),
      availability: "unknown",
      file,
      index,
    });
  });
  props.pending?.resourceUrls.forEach((url) => {
    const key = `url-${url}`,
      meta = props.pending!.resourceMetadata[key];
    rows.push({
      key,
      title: meta?.title || url,
      type: meta?.resourceType || "main",
      format: meta?.format || getFileExtension(url, true).slice(1),
      availability: "unknown",
      url,
    });
  });
  const normalizedQuery = query.trim().toLocaleLowerCase(i18n.language);
  const filtered = rows.filter(
    (row) =>
      (filter === "all" || row.availability === filter) &&
      row.title.toLocaleLowerCase(i18n.language).includes(normalizedQuery)
  );
  if (sort.order !== "none")
    filtered.sort((a, b) => {
      const comparison =
        sort.field === "title"
          ? a.title.localeCompare(b.title, i18n.language)
          : (Date.parse(a.date || "") || 0) - (Date.parse(b.date || "") || 0);
      return sort.order === "descending" ? -comparison : comparison;
    });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedKeys = selected.filter((key) => rows.some((row) => row.key === key));
  const selectedVisible = visible.filter((row) => selectedKeys.includes(row.key)).length;
  const toggle = (keys: string[], checked: boolean) =>
    setSelected((previous) =>
      checked ? [...new Set([...previous, ...keys])] : previous.filter((key) => !keys.includes(key))
    );
  const refresh = async () => {
    if (!props.datasetId) return;
    try {
      const dataset = await fetchDataset(props.datasetId);
      props.onResourcesChange?.(dataset.resources);
      setRefreshError(false);
    } catch {
      setRefreshError(true);
    }
  };
  const openSaved = (resource: Resource) => {
    if (!props.datasetId) return;
    const options = {
      title: resource.title,
      closeAriaLabel: t("edit.cancel"),
      dimensions: "l" as const,
    };
    show(
      <DatasetsEditResourceDetailPopup
        resource={resource}
        onClose={hide}
        onEdit={() =>
          show(
            <DatasetsEditResourceEditPopup
              resource={resource}
              datasetId={props.datasetId!}
              resourceTypes={props.resourceTypes}
              onCancel={hide}
              onSaved={() => {
                void refresh();
                hide();
              }}
            />,
            options
          )
        }
        onDelete={() =>
          show(
            <DeleteResourcePopup
              resource={resource}
              datasetId={props.datasetId!}
              onDeleted={() =>
                props.onResourcesChange?.(
                  (props.savedResources ?? []).filter((item) => item.id !== resource.id)
                )
              }
            />,
            { ...options, dimensions: "s" }
          )
        }
      />,
      options
    );
  };
  const changeSort = (field: "title" | "date", order: "none" | "ascending" | "descending") => {
    setSort({ field, order });
    setPage(1);
  };
  const headings = ["title", "availability", "type", "format", "updated"] as const;
  const filters = [
    { value: "all", icon: "agora-line-layers-menu" },
    { value: "available", icon: "agora-line-check-circle" },
    { value: "unavailable", icon: "agora-line-x-circle" },
    { value: "unknown", icon: "agora-line-info-mark" },
  ];
  return (
    <section className="flex min-w-0 flex-col gap-32" aria-labelledby={`${tableId}-title`}>
      <div className="flex flex-col gap-8">
        <h3 id={`${tableId}-title`} className="text-xl-bold text-primary-900">
          {t("resources.addedTitle")}
        </h3>
        <p className="text-m-regular text-primary-900">{t("resources.addedDescription")}</p>
      </div>
      <div className="[&_.magnifier-icon]:size-44! [&_.magnifier-icon]:min-h-44! [&_.magnifier-icon]:min-w-44! w-full max-w-[592px] [&_.input-search-bar-container]:min-w-0! [&_.input-search-bar-container]:border-neutral-700! [&_.input-search-bar-container]:p-4! [&_.input-search-bar-container]:pl-16! [&_.magnifier-icon]:border-transparent! [&_.magnifier-icon]:bg-transparent! [&_.magnifier-icon]:p-[10px]! [&_.magnifier-icon]:text-neutral-900! [&_.magnifier-icon]:opacity-100! [&_.magnifier-icon_svg]:fill-neutral-900! [&_input]:min-w-0!">
        <InputSearchBar
          hasVoiceActionButton={false}
          searchActionAltText={t("resources.search")}
          id={`${tableId}-search`}
          label={t("resources.search")}
          placeholder={t("resources.searchPlaceholder")}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
      </div>
      <div className="flex flex-col gap-8">
        <ToggleGroup
          id={`${tableId}-filter`}
          value={filter}
          appearance="button"
          variant="primary"
          fullWidth
          multiple={false}
          onChange={(values) => {
            setFilter(values[0] || "all");
            setPage(1);
          }}
          className="max-md:flex-wrap"
        >
          {filters.map((item) => (
            <Toggle
              key={item.value}
              value={item.value}
              hasIcon
              leadingIcon={item.icon}
              leadingIconHover={item.icon.replace("agora-line-", "agora-solid-")}
            >
              {t(`resources.${item.value}`)}
            </Toggle>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col">
        {refreshError && (
          <StatusCard variant="danger" showIcon description={t("resources.refreshError")} />
        )}
        {selectable && selectedKeys.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-16 bg-warning-50 p-16 text-warning-900">
            <p className="text-m-bold" role="status">
              {t("resources.selected", { count: selectedKeys.length })}
            </p>
            <div className="flex flex-wrap items-center gap-16">
              <span id={`${tableId}-bulk-delete-hint`} className="text-s-regular">
                {t("resources.bulkUnavailable")}
              </span>
              <Button
                appearance="link"
                variant="danger"
                hasIcon
                leadingIcon="agora-line-trash"
                disabled
                aria-describedby={`${tableId}-bulk-delete-hint`}
              >
                {t("edit.confirmDelete")}
              </Button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <AdminPaginatedTable
            pageSize={pageSize}
            totalItems={filtered.length}
            currentPage={currentPage}
            setCurrentPage={setPage}
            setPageSize={setPageSize}
            paginationOptions={{ availablePageSizes: [5, 10, 20] }}
          >
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableSelectionHeaderCell
                    selectionState={
                      !selectedVisible
                        ? "none"
                        : selectedVisible === visible.length
                          ? "all"
                          : "indeterminate"
                    }
                    onSelectionChange={(checked) =>
                      toggle(
                        visible.map((row) => row.key),
                        checked
                      )
                    }
                  />
                )}
                {headings.map((heading) => (
                  <TableHeaderCell
                    key={heading}
                    sortType={
                      heading === "title" ? "string" : heading === "updated" ? "date" : undefined
                    }
                    sortOrder={
                      sort.field === (heading === "updated" ? "date" : heading)
                        ? sort.order
                        : "none"
                    }
                    onSortChange={
                      heading === "title" || heading === "updated"
                        ? (order) => changeSort(heading === "updated" ? "date" : "title", order)
                        : undefined
                    }
                  >
                    {t(`resources.columns.${heading}`)}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length ? (
                visible.map((row, index) => (
                  <TableRow key={row.key}>
                    {selectable && (
                      <TableSelectionCell
                        checked={selectedKeys.includes(row.key)}
                        onChange={(checked) => toggle([row.key], checked)}
                        checkboxAriaLabelledBy={`${tableId}-resource-${index}`}
                      />
                    )}
                    <TableCell
                      id={`${tableId}-resource-${index}`}
                      headerLabel={t("resources.columns.title")}
                    >
                      {row.resource ? (
                        <button
                          type="button"
                          className="text-left break-words text-primary-600 underline"
                          onClick={() => (props.onResourceClick ?? openSaved)(row.resource!)}
                        >
                          {row.title}
                        </button>
                      ) : (
                        <ResourceItem
                          appearance="title"
                          onEdit={
                            props.pending?.onEditResource
                              ? () => props.pending!.onEditResource!(row.file || row.url!)
                              : undefined
                          }
                          name={row.file?.name || row.url!}
                          file={row.file}
                          size={row.file ? formatFileSize(row.file.size) : undefined}
                          isUrl={!!row.url}
                          resourceTypes={props.resourceTypes}
                          currentMeta={
                            props.pending!.resourceMetadata[row.key] ?? {
                              title: row.title,
                              resourceType: row.type,
                              description: "",
                            }
                          }
                          onSaveMeta={(meta, newUrl) =>
                            props.pending!.onEditMeta(row.key, meta, newUrl)
                          }
                          onRemove={() =>
                            row.file
                              ? props.pending!.setUploadedFiles((previous) =>
                                  previous.filter((file) => file !== row.file)
                                )
                              : props.pending!.setResourceUrls((previous) =>
                                  previous.filter((url) => url !== row.url)
                                )
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell headerLabel={t("resources.columns.availability")}>
                      <Pill
                        variant={
                          row.availability === "available"
                            ? "success"
                            : row.availability === "unavailable"
                              ? "danger"
                              : "neutral"
                        }
                        className="h-32! rounded-[999px]! px-8! text-s-regular whitespace-nowrap"
                      >
                        {t(`resources.${row.availability}`)}
                      </Pill>
                    </TableCell>
                    <TableCell headerLabel={t("resources.columns.type")}>
                      {props.resourceTypes.find((type) => type.id === row.type)?.label || row.type}
                    </TableCell>
                    <TableCell headerLabel={t("resources.columns.format")}>
                      {row.format?.toUpperCase() || "—"}
                    </TableCell>
                    <TableCell headerLabel={t("resources.columns.updated")}>
                      {row.date && !Number.isNaN(Date.parse(row.date))
                        ? new Date(row.date)
                            .toLocaleDateString(i18n.language, {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                            .replaceAll("/", ".")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    headerLabel={t("resources.columns.title")}
                    colSpan={selectable ? 6 : 5}
                  >
                    {t(rows.length ? "resources.noMatches" : "resources.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </AdminPaginatedTable>
        </div>
      </div>
    </section>
  );
}
