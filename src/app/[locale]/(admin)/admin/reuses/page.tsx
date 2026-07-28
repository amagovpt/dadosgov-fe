import type { Metadata } from "next";
import { getBoReuses, getBoReusesMetadata } from "@/service/queries/admin/reuses";
import ReusesClient from "@/components/admin/reuses/views/ReusesClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoReusesMetadata(locale, "listMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function ReusesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoReuses(locale);

  return <ReusesClient pageContent={pageContent} />;
}
