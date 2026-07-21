import type { Metadata } from "next";
import UserProfileClient from "@/components/admin/users/UserProfileClient";
import { getBoUsers, getBoUsersMetadata } from "@/service/queries/admin/users";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoUsersMetadata(locale, "profileMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoUsers(locale);

  return <UserProfileClient pageContent={pageContent} />;
}
