import { AdminHero, AdminMetadata } from "@/service/types/admin/common";
import type { FoListPageNoResults } from "@/service/types/shared";

export type BoProfileMetadata = AdminMetadata;
export type BoProfilePage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  followingsNoResults?: FoListPageNoResults;
};
