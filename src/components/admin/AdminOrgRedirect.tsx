"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

interface AdminOrgRedirectProps {
  targetPath: string;
  preserveSearchParams?: boolean;
  requireActiveOrganization?: boolean;
}

function AdminOrgRedirectInner({
  targetPath,
  preserveSearchParams = false,
  requireActiveOrganization = true,
}: AdminOrgRedirectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrg, isLoading } = useActiveOrganization();

  useEffect(() => {
    if (requireActiveOrganization && isLoading) return;

    if (requireActiveOrganization && !activeOrg) {
      router.replace("/admin");
      return;
    }

    const resolvedPath = activeOrg ? targetPath.replace("{orgId}", activeOrg.id) : targetPath;
    const params = preserveSearchParams ? searchParams.toString() : "";

    router.replace(`${resolvedPath}${params ? `?${params}` : ""}`);
  }, [
    activeOrg,
    isLoading,
    preserveSearchParams,
    requireActiveOrganization,
    router,
    searchParams,
    targetPath,
  ]);

  return null;
}

export default function AdminOrgRedirect(props: AdminOrgRedirectProps) {
  return (
    <Suspense fallback={null}>
      <AdminOrgRedirectInner {...props} />
    </Suspense>
  );
}
