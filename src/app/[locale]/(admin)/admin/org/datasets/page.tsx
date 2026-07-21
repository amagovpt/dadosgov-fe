import type { Metadata } from "next";
import { getBoDatasetsMetadata } from "@/service/queries/admin/datasets";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDatasetsMetadata(locale, "orgListMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function OrgDatasetsRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/datasets" />;
}
