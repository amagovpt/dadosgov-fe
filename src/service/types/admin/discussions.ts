import { AdminHero, AdminMetadata } from "@/service/types/admin/common";
import type { FoListPageNoResults } from "@/service/types/shared";

export type BoDiscussionsMetadata = AdminMetadata;
export type BoDiscussionsMetadataField = "redirectMetadata" | "orgMetadata";

export type BoDiscussionsPage = {
  redirectMetadata?: AdminMetadata;
  orgMetadata?: AdminMetadata;
  orgHero?: AdminHero;
  orgNoResults?: FoListPageNoResults;
};
