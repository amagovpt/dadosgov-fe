import type { Metadata } from "next";
import { getBoHarvestersMetadata } from "@/service/queries/admin/harvesters";
import HarvestJobDetailClient from "@/components/admin/harvesters/views/HarvestJobDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoHarvestersMetadata(locale, "jobDetailMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function HarvesterJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string; jobId: string }>;
}) {
  const { slug, jobId } = await params;
  return <HarvestJobDetailClient slug={slug} jobId={jobId} />;
}
