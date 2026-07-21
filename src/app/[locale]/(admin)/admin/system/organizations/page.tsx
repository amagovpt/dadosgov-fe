import type { Metadata } from "next";
import { getBoOrganizations, getBoOrganizationsMetadata } from "@/service/queries/admin/organizations";
import SystemOrganizationsClient from "@/components/admin/organizations/SystemOrganizationsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoOrganizationsMetadata(locale, "systemMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function SystemOrganizationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoOrganizations(locale);

  return <SystemOrganizationsClient pageContent={pageContent} />;
}
