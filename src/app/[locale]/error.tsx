"use client";

import { ErrorState } from "@/components/Shared/ErrorState";
import { useNavigationRollback } from "@/providers/ApiErrorProvider";
import { apiFailureFromDigest, isRefusal } from "@/service/utils/apiErrorPolicy";
import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {

  const status = apiFailureFromDigest(error.digest);
  const rollingBack = useNavigationRollback(!isRefusal(status));

  useEffect(() => {
    // Server-side details are in the Next.js container logs under the digest.
    console.error("[error-boundary]", error);
  }, [error]);

  // Blank for the frame it takes the bfcache to put the previous page back.
  // The layout is still mounted, so the header and the footer stay put.
  if (rollingBack) return null;

  return <ErrorState reset={reset} status={status} />;
}
