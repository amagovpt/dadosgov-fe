import type { Metadata } from "next";
import OrgStatisticsClient from "@/components/admin/statistics/OrgStatisticsClient";
import { getBoStatistics, getBoStatisticsMetadata } from "@/service/queries/admin/statistics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoStatisticsMetadata(locale, "orgMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function OrgStatisticsPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoStatistics(locale);

  return <OrgStatisticsClient orgId={orgId} pageContent={pageContent} />;
}
