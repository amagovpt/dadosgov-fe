"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

export default function OrgHarvestersRedirect() {
  const router = useRouter();
  const { activeOrg, isLoading } = useActiveOrganization();

  useEffect(() => {
    if (isLoading) return;
    if (activeOrg) {
      router.replace(`/admin/org/${activeOrg.id}/harvesters`);
    } else {
      router.replace("/admin");
    }
  }, [activeOrg, isLoading, router]);

  return null;
}
