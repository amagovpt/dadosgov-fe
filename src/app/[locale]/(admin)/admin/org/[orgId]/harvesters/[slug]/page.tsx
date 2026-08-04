import type { Metadata } from "next";
import { getBoHarvesters, getBoHarvestersMetadata } from "@/service/queries/admin/harvesters";
import { Suspense } from "react";
import HarvesterDetailClient from "@/components/admin/harvesters/views/HarvesterDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoHarvestersMetadata(locale, "orgDetailMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function OrgHarvesterDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string; slug: string }>;
}) {
  const { locale, orgId, slug } = await params;
  const pageContent = await getBoHarvesters(locale);
  return (
    <Suspense>
      <HarvesterDetailClient slug={slug} orgId={orgId} pageContent={pageContent} />
    </Suspense>
  );
}
