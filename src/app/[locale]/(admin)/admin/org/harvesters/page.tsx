import type { Metadata } from "next";
import { getBoHarvestersMetadata } from "@/service/queries/admin/harvesters";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoHarvestersMetadata(locale, "orgRedirectMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function OrgHarvestersRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/harvesters" />;
}
