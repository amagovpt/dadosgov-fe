import type { Metadata } from "next";
import { getBoCommunityResourcesMetadata } from "@/service/queries/admin/community-resources";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoCommunityResourcesMetadata(locale, "orgRedirectMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function OrgCommunityResourcesRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/community-resources" />;
}
