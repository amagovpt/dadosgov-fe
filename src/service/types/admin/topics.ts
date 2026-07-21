import { AdminHero, AdminMetadata } from "@/service/types/admin/common";
import type { FoListPageNoResults } from "@/service/types/shared";

export type BoTopicsMetadata = AdminMetadata;
export type BoTopicsPage = {
  systemMetadata?: AdminMetadata;
  systemHero?: AdminHero;
  systemNoResults?: FoListPageNoResults;
};
