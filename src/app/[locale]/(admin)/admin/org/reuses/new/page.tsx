import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";
import { getBoReusesMetadata } from "@/service/queries/admin/reuses";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoReusesMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default function OrgReusesNewRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/reuses/new" preserveSearchParams />;
}
