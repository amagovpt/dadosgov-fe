import { AdminHero, AdminMetadata } from "@/service/types/admin/common";

export type BoMembersMetadata = AdminMetadata;
export type BoMembersMetadataField = "redirectMetadata" | "orgMetadata";

export type BoMembersPage = {
  redirectMetadata?: AdminMetadata;
  orgMetadata?: AdminMetadata;
  orgHero?: AdminHero;
};
