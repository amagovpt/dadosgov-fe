import type { Metadata } from "next";
import SystemUsersClient from "@/components/admin/users/SystemUsersClient";
import { getBoUsers, getBoUsersMetadata } from "@/service/queries/admin/users";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoUsersMetadata(locale, "systemMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function SystemUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoUsers(locale);

  return <SystemUsersClient pageContent={pageContent} />;
}
