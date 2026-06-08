"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  InputSearchBar,
  Table,
  TableHeader,
  TableBody,
  TableRow,
} from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import ResultsCount from "@/components/admin/ResultsCount";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { createPaginationProps } from "@/utils/createPaginationProps";

export type SortOrder = "none" | "ascending" | "descending";

export interface SortHelpers {
  getSortOrder: (field: string) => SortOrder;
  onSortChange: (field: string) => (order: SortOrder) => void;
}

export interface ServerLoadParams {
  page: number;
  pageSize: number;
  query: string;
  status: string;
  sortField: string | null;
  sortOrder: SortOrder;
}

export interface ClientStrategy<T> {
  mode: "client";
  load: () => Promise<T[]>;
  filter: (items: T[], query: string, status: string) => T[];
  sort: (items: T[], field: string | null, order: SortOrder) => T[];
}

export interface ServerStrategy<T> {
  mode: "server";
  load: (params: ServerLoadParams) => Promise<{ data: T[]; total: number }>;
}

export interface AdminResourceListPageProps<T> {
  strategy: ClientStrategy<T> | ServerStrategy<T>;
  breadcrumbItems: { label: string; url?: string }[];
  title: string;
  renderHeaders: (sort: SortHelpers) => React.ReactNode;
  renderRow: (item: T) => React.ReactNode;
  showStatusFilter?: boolean;
  searchPlaceholder?: string;
  toolbarExtra?: React.ReactNode;
  emptyState: {
    icon: string;
    title?: string;
    description?: string;
    createUrl?: string;
    createTitle?: string;
  };
  renderEmpty?: () => React.ReactNode;
  initialStatus?: string;
  defaultPageSize?: number;
  defaultSortField?: string;
  defaultSortOrder?: SortOrder;
  enabled?: boolean;
}

export function AdminResourceListPage<T>({
  strategy,
  breadcrumbItems,
  title,
  renderHeaders,
  renderRow,
  showStatusFilter = true,
  searchPlaceholder = "Pesquisar...",
  toolbarExtra,
  emptyState,
  renderEmpty,
  initialStatus = "",
  defaultPageSize = 10,
  defaultSortField,
  defaultSortOrder = "none",
  enabled = true,
}: AdminResourceListPageProps<T>) {
  const strategyRef = useRef(strategy);
  strategyRef.current = strategy;

  const [allItems, setAllItems] = useState<T[]>([]);
  const [serverItems, setServerItems] = useState<T[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sortField, setSortField] = useState<string | null>(defaultSortField ?? null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortHelpers: SortHelpers = {
    getSortOrder: (field) => (sortField === field ? sortOrder : "none"),
    onSortChange: (field) => (order) => {
      setSortField(order === "none" ? null : field);
      setSortOrder(order);
      setCurrentPage(1);
    },
  };

  // Client strategy: extract stable function references at render time
  const filterFn = strategy.mode === "client" ? strategy.filter : null;
  const sortFn = strategy.mode === "client" ? strategy.sort : null;

  // Client strategy: load all items once when enabled becomes true
  useEffect(() => {
    if (!enabled || strategyRef.current.mode !== "client") return;
    setIsLoading(true);
    let cancelled = false;
    strategyRef.current
      .load()
      .then((data) => {
        if (!cancelled) setAllItems(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Client strategy: derive current page items from the full dataset
  const { clientItems, clientTotal } = useMemo(() => {
    if (!filterFn || !sortFn) return { clientItems: [] as T[], clientTotal: 0 };
    const filtered = filterFn(allItems, searchQuery, statusFilter);
    const sorted = sortFn(filtered, sortField, sortOrder);
    const start = (currentPage - 1) * pageSize;
    return { clientItems: sorted.slice(start, start + pageSize), clientTotal: sorted.length };
  }, [filterFn, sortFn, allItems, searchQuery, statusFilter, sortField, sortOrder, currentPage, pageSize]);

  // Server strategy: fetch on every param change
  const serverLoad = useCallback(async () => {
    const s = strategyRef.current;
    if (!enabled || s.mode !== "server") return;
    setIsLoading(true);
    try {
      const { data, total } = await s.load({
        page: currentPage,
        pageSize,
        query: searchQuery.trim(),
        status: statusFilter,
        sortField,
        sortOrder,
      });
      setServerItems(data);
      setServerTotal(total);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, currentPage, pageSize, searchQuery, statusFilter, sortField, sortOrder]);

  useEffect(() => {
    if (strategyRef.current.mode === "server") void serverLoad();
  }, [serverLoad]);

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 400);
  };

  const isClient = strategy.mode === "client";
  const displayItems = isClient ? clientItems : serverItems;
  const displayTotal = isClient ? clientTotal : serverTotal;

  return (
    <AdminLayout breadcrumbItems={breadcrumbItems} title={title}>
      <ResultsCount count={displayTotal} isLoading={isLoading} />
      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
        </div>
        {showStatusFilter && (
          <StatusFilterSelect
            value={statusFilter}
            defaultValue={statusFilter || undefined}
            onChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          />
        )}
        {toolbarExtra}
      </div>
      {isLoading ? (
        <p className="text-sm text-neutral-700">A carregar...</p>
      ) : displayItems.length > 0 ? (
        <Table
          paginationProps={createPaginationProps(
            pageSize,
            displayTotal,
            currentPage,
            setCurrentPage,
            setPageSize,
          )}
        >
          <TableHeader>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <TableRow>{renderHeaders(sortHelpers) as any}</TableRow>
          </TableHeader>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <TableBody>{displayItems.map(renderRow) as any}</TableBody>
        </Table>
      ) : (
        renderEmpty?.() ?? <AdminEmptyState {...emptyState} />
      )}
    </AdminLayout>
  );
}
