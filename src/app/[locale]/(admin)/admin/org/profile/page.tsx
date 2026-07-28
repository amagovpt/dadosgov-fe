import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";
import { getBoOrganizationsMetadata } from "@/service/queries/admin/organizations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoOrganizationsMetadata(locale, "orgProfileRedirectMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function OrgProfileRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/profile" />;
}
