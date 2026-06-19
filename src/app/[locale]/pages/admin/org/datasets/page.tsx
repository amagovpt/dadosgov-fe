"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

export default function OrgDatasetsRedirect() {
  const router = useRouter();
  const { activeOrg, isLoading } = useActiveOrganization();

  useEffect(() => {
    if (isLoading) return;
    if (activeOrg) {
      router.replace(`/pages/admin/org/${activeOrg.id}/datasets`);
    } else {
      router.replace("/pages/admin");
    }
  }, [activeOrg, isLoading, router]);

  return null;
}
