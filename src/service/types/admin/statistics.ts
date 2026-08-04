import { AdminCard, AdminHero, AdminMetadata } from "@/service/types/admin/common";
import type { FoListPageNoResults, FoListPageSearch } from "@/service/types/shared";

export type BoStatisticsMetadata = AdminMetadata;
export type BoStatisticsMetadataField =
  | "userMetadata"
  | "orgRedirectMetadata"
  | "orgMetadata";

export type BoStatisticsPage = {
  userMetadata?: AdminMetadata;
  orgRedirectMetadata?: AdminMetadata;
  orgMetadata?: AdminMetadata;
  userHero?: AdminHero;
  orgHero?: AdminHero;
  userSummaryCards?: AdminCard[];
  orgSummaryCards?: AdminCard[];
  datasetsSearch?: FoListPageSearch;
  dataservicesSearch?: FoListPageSearch;
  reusesSearch?: FoListPageSearch;
  datasetsNoResults?: FoListPageNoResults;
  dataservicesNoResults?: FoListPageNoResults;
  reusesNoResults?: FoListPageNoResults;
  noOrganizations?: FoListPageNoResults;
};
