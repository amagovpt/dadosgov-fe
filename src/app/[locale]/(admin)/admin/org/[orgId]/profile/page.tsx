import type { Metadata } from "next";
import OrgProfileClient from "@/components/admin/profile/organization/OrgProfileClient";
import { getBoOrganizations, getBoOrganizationsMetadata } from "@/service/queries/admin/organizations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoOrganizationsMetadata(locale, "orgProfileMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoOrganizations(locale);

  return <OrgProfileClient pageTitle={pageContent.orgProfileHero?.title ?? ""} />;
}
