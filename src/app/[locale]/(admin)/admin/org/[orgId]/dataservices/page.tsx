import type { Metadata } from "next";
import { getBoDataservices, getBoDataservicesMetadata } from "@/service/queries/admin/dataservices";
import OrgDataservicesClient from "@/components/admin/dataservices/views/OrgDataservicesClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDataservicesMetadata(locale, "orgMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function OrgDataservicesPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoDataservices(locale);

  return <OrgDataservicesClient orgId={orgId} pageContent={pageContent} />;
}
