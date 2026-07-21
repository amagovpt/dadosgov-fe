import type { Metadata } from "next";
import { getBoDataservicesMetadata } from "@/service/queries/admin/dataservices";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDataservicesMetadata(locale, "orgRedirectMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function OrgDataservicesRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/dataservices" />;
}
