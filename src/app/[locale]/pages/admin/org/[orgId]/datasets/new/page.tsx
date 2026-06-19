"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OrgDatasetsNewRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(`/pages/admin/org/datasets/new${params ? `?${params}` : ""}`);
  }, [router, searchParams]);

  return null;
}
