import type { Metadata } from "next";
import { getBoReusesMetadata } from "@/service/queries/admin/reuses";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoReusesMetadata(locale, "orgRedirectMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function OrgReusesRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/reuses" />;
}
