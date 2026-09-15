"use client";

import { RouteErrorBoundary } from "@/components/Shared/RouteErrorBoundary";

export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary {...props} withPortalHeader />;
}
