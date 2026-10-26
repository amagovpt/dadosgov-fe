"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

const DatasetContentContext = createContext<BoDatasetsPage>({});

export function DatasetContentProvider({
  content,
  children,
}: {
  content: BoDatasetsPage;
  children: ReactNode;
}) {
  return (
    <DatasetContentContext.Provider value={content}>{children}</DatasetContentContext.Provider>
  );
}

export function useDatasetContent() {
  return useContext(DatasetContentContext);
}

export function useDatasetSection(key: string) {
  return useDatasetContent().formSections?.find((section) => section.key?.trim() === key);
}

export function useDatasetConfirmation(key: string) {
  return useDatasetContent().confirmationDialogs?.find((dialog) => dialog.key?.trim() === key);
}

export function DatasetContentDescription({
  html,
  className,
}: {
  html?: string;
  className?: string;
}) {
  return html?.trim() ? <>{formatHtmlParagraphs(html, className)}</> : null;
}
