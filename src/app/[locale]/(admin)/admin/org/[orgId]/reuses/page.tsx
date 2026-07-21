import type { Metadata } from "next";
import { getBoReuses, getBoReusesMetadata } from "@/service/queries/admin/reuses";
import OrgReusesClient from "@/components/admin/reuses/views/OrgReusesClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoReusesMetadata(locale, "orgMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function OrgReusesPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoReuses(locale);

  return <OrgReusesClient orgId={orgId} pageContent={pageContent} />;
}
