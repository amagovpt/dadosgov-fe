import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";
import { getBoDiscussionsMetadata } from "@/service/queries/admin/discussions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDiscussionsMetadata(locale, "redirectMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function OrgDiscussionsRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/discussions" />;
}
