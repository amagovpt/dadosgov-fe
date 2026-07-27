import DatasetDetailClient from "@/components/datasets/DatasetDetailClient";
import { fetchDataset } from "@/service/api/datasets";
import { serverAuthHeaders } from "@/service/utils/serverForwardedHeaders";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Authenticated SSR: forward the visitor's session so private-draft
  // ("Rascunho") visibility is correct in the server HTML (no client refetch).
  const forwarded = await serverAuthHeaders();

  let dataset;
  try {
    dataset = await fetchDataset(slug, forwarded);
  } catch {
    notFound();
  }

  return <DatasetDetailClient dataset={dataset} />;
}
