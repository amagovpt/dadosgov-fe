import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";
import { getBoDatasetsMetadata } from "@/service/queries/admin/datasets";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDatasetsMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default function OrgDatasetsNewRedirect() {
  return (
    <AdminOrgRedirect
      targetPath="/admin/org/datasets/new"
      preserveSearchParams
      requireActiveOrganization={false}
    />
  );
}
