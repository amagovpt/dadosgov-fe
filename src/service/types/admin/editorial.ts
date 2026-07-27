import { AdminHero, AdminMetadata } from "@/service/types/admin/common";

export type BoEditorialMetadata = AdminMetadata;
export type BoEditorialPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
};
