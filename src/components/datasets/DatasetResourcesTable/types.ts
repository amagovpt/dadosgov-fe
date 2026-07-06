import { CommunityResource } from "@/service/types/community-resource";
import { Resource } from "@/service/types/dataset";

export interface DatasetResourcesTableProps {
  resources: Resource[];
  communityResources?: CommunityResource[];
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
