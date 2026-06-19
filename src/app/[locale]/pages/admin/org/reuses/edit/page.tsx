"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

export default function OrgReusesEditRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrg, isLoading } = useActiveOrganization();

  useEffect(() => {
    if (isLoading) return;
    if (activeOrg) {
      const params = searchParams.toString();
      router.replace(
        `/pages/admin/org/${activeOrg.id}/reuses/edit${params ? `?${params}` : ""}`,
      );
    } else {
      router.replace("/pages/admin");
    }
  }, [activeOrg, isLoading, router, searchParams]);

  return null;
}
