import type { Metadata } from "next";
import { getBoReuses, getBoReusesMetadata } from "@/service/queries/admin/reuses";
import ReusesEditClient from "@/components/admin/reuses/views/ReusesEditClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoReusesMetadata(locale, "editMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function ReusePage({
  params,
}: {
  params: Promise<{ locale: string; reuseId: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoReuses(locale);

  return <ReusesEditClient pageContent={pageContent} />;
}
