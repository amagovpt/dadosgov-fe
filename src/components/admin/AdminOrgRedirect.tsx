"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { localizeHref } from "@/utils/localizeHref";
import { splitLocale } from "@/utils/stripLocale";

interface AdminOrgRedirectProps {
  targetPath: string;
  preserveSearchParams?: boolean;
}

function AdminOrgRedirectInner({
  targetPath,
  preserveSearchParams = false,
}: AdminOrgRedirectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = splitLocale(usePathname());
  const { activeOrg, isLoading } = useActiveOrganization();

  useEffect(() => {
    if (isLoading) return;

    if (!activeOrg) {
      router.replace(localizeHref("/admin", locale));
      return;
    }

    const resolvedPath = targetPath.replace("{orgId}", activeOrg.id);
    const params = preserveSearchParams ? searchParams.toString() : "";

    router.replace(localizeHref(`${resolvedPath}${params ? `?${params}` : ""}`, locale));
  }, [activeOrg, isLoading, preserveSearchParams, locale, router, searchParams, targetPath]);

  return null;
}

export default function AdminOrgRedirect(props: AdminOrgRedirectProps) {
  return (
    <Suspense fallback={null}>
      <AdminOrgRedirectInner {...props} />
    </Suspense>
  );
}
