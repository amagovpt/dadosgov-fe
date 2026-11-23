"use client";

import type { BoDiscussionsPage } from "@/service/types/admin/discussions";
import DiscussionsListClient from "./DiscussionsListClient";

export default function OrgDiscussionsClient({
  orgId,
  pageContent,
}: {
  orgId: string;
  pageContent: BoDiscussionsPage;
}) {
  return <DiscussionsListClient scope="organization" orgId={orgId} pageContent={pageContent} />;
}
