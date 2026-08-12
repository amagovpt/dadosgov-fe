import type { Metadata } from "next";
import ReusesNewClient from "@/components/admin/reuses/views/ReusesNewClient";
import { getBoReuses, getBoReusesMetadata } from "@/service/queries/admin/reuses";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoReusesMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default async function ReusesNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoReuses(locale);

  return <ReusesNewClient pageContent={pageContent} />;
}
