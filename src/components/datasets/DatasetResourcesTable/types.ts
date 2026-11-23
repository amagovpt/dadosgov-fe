import { CommunityResource } from "@/service/types/community-resource";

export interface DatasetResourcesTableProps {
  communityResources: CommunityResource[];
}

export interface ColumnInfo {
  name: string;
  type: string;
}

export interface TabularData {
  headers: string[];
  columns: ColumnInfo[];
  rows: string[][];
  totalRows: number;
  totalCols: number;
  lastModified: string | null;
}

export interface SpreadsheetPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  totalCols: number;
  lastModified: string | null;
}
