"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

export default function OrgDatasetsEditRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrg, isLoading } = useActiveOrganization();

  useEffect(() => {
    if (isLoading) return;
    if (activeOrg) {
      const params = searchParams.toString();
      router.replace(
        `/admin/org/${activeOrg.id}/datasets/edit${params ? `?${params}` : ""}`,
      );
    } else {
      router.replace("/admin");
    }
  }, [activeOrg, isLoading, router, searchParams]);

  return null;
}
