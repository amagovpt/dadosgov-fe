"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

export default function OrgReusesRedirect() {
  const router = useRouter();
  const { activeOrg, isLoading } = useActiveOrganization();

  useEffect(() => {
    if (isLoading) return;
    if (activeOrg) {
      router.replace(`/pages/admin/org/${activeOrg.id}/reuses`);
    } else {
      router.replace("/pages/admin");
    }
  }, [activeOrg, isLoading, router]);

  return null;
}
