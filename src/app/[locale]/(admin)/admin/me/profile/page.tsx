import type { Metadata } from "next";
import ProfileClient from "@/components/admin/profile/user/ProfileClient";
import { getBoProfile, getBoProfileMetadata } from "@/service/queries/admin/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoProfileMetadata(locale);

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoProfile(locale);

  return <ProfileClient pageContent={pageContent} />;
}
