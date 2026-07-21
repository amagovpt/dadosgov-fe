import type { Metadata } from "next";
import { getBoReuses, getBoReusesMetadata } from "@/service/queries/admin/reuses";
import ReusesEditClient from "@/components/admin/reuses/views/ReusesEditClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoReusesMetadata(locale, "orgMemberEditMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function OrgReusesEditPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoReuses(locale);

  return <ReusesEditClient pageContent={pageContent} />;
}
