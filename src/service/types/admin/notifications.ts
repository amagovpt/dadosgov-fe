import { AdminHelpBlock, AdminHero, AdminMetadata } from "@/service/types/admin/common";
import type { FoListPageNoResults } from "@/service/types/shared";

export type BoNotificationsMetadata = AdminMetadata;
export type BoNotificationsPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  intro?: AdminHelpBlock;
  noResults?: FoListPageNoResults;
};
