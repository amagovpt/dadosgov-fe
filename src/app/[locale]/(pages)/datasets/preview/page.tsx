"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DatasetDetailClient from "@/components/datasets/DatasetDetailClient";
import { fetchDataset } from "@/service/api/datasets";
import { Dataset } from "@/service/types/dataset";

function DatasetPreviewContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "preview";

  // The preview route is client-only (it reads the slug from the URL and carries
  // the editor's session), so it fetches the dataset here and hands it to the now
  // props-driven DatasetDetailClient. Public detail pages fetch server-side.
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadDataset() {
      try {
        const data = await fetchDataset(slug);
        if (!cancelled) setDataset(data);
      } catch (error) {
        console.error("Error loading dataset:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadDataset();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return null;
  }

  if (!dataset) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-500">Conjunto de dados não encontrado.</p>
      </div>
    );
  }

  return <DatasetDetailClient dataset={dataset} />;
}

export default function DatasetPreviewPage() {
  return (
    <Suspense>
      <DatasetPreviewContent />
    </Suspense>
  );
}
