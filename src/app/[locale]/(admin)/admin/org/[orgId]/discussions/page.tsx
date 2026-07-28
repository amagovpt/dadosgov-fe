import type { Metadata } from "next";
import OrgDiscussionsClient from "@/components/admin/discussions/OrgDiscussionsClient";
import {
  getBoDiscussions,
  getBoDiscussionsMetadata,
} from "@/service/queries/admin/discussions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDiscussionsMetadata(locale, "orgMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function OrgDiscussionsPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoDiscussions(locale);

  return <OrgDiscussionsClient orgId={orgId} pageContent={pageContent} />;
}
