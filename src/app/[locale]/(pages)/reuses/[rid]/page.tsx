import ReuseDetailClient from "@/components/reuses/ReuseDetailClient";
import { fetchReuse } from "@/service/api/reuses";
import { fetchDataset } from "@/service/api/datasets";
import { Dataset } from "@/service/types/dataset";
import { serverAuthHeaders } from "@/service/utils/serverForwardedHeaders";
import { getFrontOfficeMetadata } from "@/service/queries/common";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";
import { Metadata } from "next";
import { notFound } from "next/navigation";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const metadata = await getFrontOfficeMetadata("reuses",locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ rid: string }>;
}) {
  const { rid } = await params;

  // Authenticated SSR: forward the visitor's session so `permissions` and
  // private-draft visibility are correct in the server HTML (no client refetch).
  const forwarded = await serverAuthHeaders();

  let reuse;
  try {
    reuse = await fetchReuse(rid, forwarded);
  } catch {
    notFound();
  }

  // Hydrate the associated datasets on the server (was a client useEffect loop).
  const slugs = (reuse.datasets ?? []).map(
    (d) => d.uri.split("/").filter(Boolean).pop() || d.id
  );
  const initialDatasets = (
    await Promise.all(slugs.map((s) => fetchDataset(s, forwarded).catch(() => null)))
  ).filter((d): d is Dataset => d !== null);

  return <ReuseDetailClient reuse={reuse} initialDatasets={initialDatasets} />;
}
