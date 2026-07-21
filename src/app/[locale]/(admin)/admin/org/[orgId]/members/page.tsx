import type { Metadata } from "next";
import MembersClient from "@/components/admin/members/MembersClient";
import { getBoMembers, getBoMembersMetadata } from "@/service/queries/admin/members";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoMembersMetadata(locale, "orgMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoMembers(locale);

  return <MembersClient orgId={orgId} pageContent={pageContent} />;
}
