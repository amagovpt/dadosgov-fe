import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";
import { getBoStatisticsMetadata } from "@/service/queries/admin/statistics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoStatisticsMetadata(locale, "orgRedirectMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function OrgStatisticsRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/statistics" />;
}
