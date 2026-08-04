import { AdminHelpBlock, AdminHero, AdminMetadata } from "@/service/types/admin/common";
import type { FoListPageNoResults } from "@/service/types/shared";

export type BoLogsMetadata = AdminMetadata;
export type BoLogsPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  intro?: AdminHelpBlock;
  noResults?: FoListPageNoResults;
};
