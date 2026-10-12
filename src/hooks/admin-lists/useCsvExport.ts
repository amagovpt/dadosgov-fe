"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import {
  buildCsvFilename,
  buildCsvFromColumns,
  downloadCsv,
} from "@/utils/admin-lists/csvExport";

/** Downloads an admin list as CSV, with the links as full URLs in the last column. */
export function useCsvExport() {
  const { t } = useTranslation("admin-common");
  const localizeHref = useLocalizedHref();

  return useCallback(
    <T, F extends string = never>(
      title: string,
      items: T[],
      columns: AdminListColumn<T, F>[]
    ) => {
      const url = {
        header: t("csvExport.url"),
        resolve: (path: string) => `${window.location.origin}${localizeHref(path)}`,
      };
      downloadCsv(buildCsvFilename(title), buildCsvFromColumns(items, columns, url));
    },
    [localizeHref, t]
  );
}
