import type { Metadata } from "next";
import OrganizationsNewClient from "@/components/admin/organizations/OrganizationsNewClient";
import {
  getBoOrganizations,
  getBoOrganizationsMetadata,
} from "@/service/queries/admin/organizations";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoOrganizationsMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default async function OrganizationsNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoOrganizations(locale);

  return <OrganizationsNewClient pageContent={pageContent} />;
}
