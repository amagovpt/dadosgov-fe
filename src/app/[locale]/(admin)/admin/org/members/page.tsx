import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";
import { getBoMembersMetadata } from "@/service/queries/admin/members";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoMembersMetadata(locale, "redirectMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function OrgMembersRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/members" />;
}
