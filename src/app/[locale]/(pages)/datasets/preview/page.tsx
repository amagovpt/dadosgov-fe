"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DatasetDetailClient from "@/components/datasets/DatasetDetailClient";

function DatasetPreviewContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "preview";

  return <DatasetDetailClient slug={slug} />;
}

export default function DatasetPreviewPage() {
  return (
    <Suspense>
      <DatasetPreviewContent />
    </Suspense>
  );
}
