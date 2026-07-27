import type { Metadata } from "next";
import StatisticsClient from "@/components/admin/statistics/StatisticsClient";
import { getBoStatistics, getBoStatisticsMetadata } from "@/service/queries/admin/statistics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoStatisticsMetadata(locale, "userMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoStatistics(locale);

  return <StatisticsClient pageContent={pageContent} />;
}
