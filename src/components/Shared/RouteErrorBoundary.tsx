"use client";

import { ErrorState } from "@/components/Shared/ErrorState";
import { PortalErrorFrame } from "@/components/Shared/PortalErrorFrame";
import { useNavigationRollback } from "@/providers/ApiErrorProvider";
import { apiFailureFromDigest, isRefusal } from "@/service/utils/apiErrorPolicy";
import { useEffect } from "react";

export function RouteErrorBoundary({
  error,
  reset,
  withPortalHeader = false,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  withPortalHeader?: boolean;
}) {
  const status = apiFailureFromDigest(error.digest);
  const rollingBack = useNavigationRollback(!isRefusal(status));

  useEffect(() => {
    // Server-side details are in the Next.js container logs under the digest.
    console.error("[error-boundary]", error);
  }, [error]);

  if (rollingBack) return null;

  const errorPage = <ErrorState reset={reset} status={status} />;

  return withPortalHeader ? <PortalErrorFrame>{errorPage}</PortalErrorFrame> : errorPage;
}
