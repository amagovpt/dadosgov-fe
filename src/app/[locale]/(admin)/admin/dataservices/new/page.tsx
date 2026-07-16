import type { Metadata } from "next";
import ApiNewClient from "@/components/admin/dataservices/views/ApiNewClient";
import { getBoDataservices, getBoDataservicesMetadata } from "@/service/queries/admin/dataservices";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDataservicesMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default async function ApiRegistrationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDataservices(locale);

  return <ApiNewClient pageContent={pageContent} />;
}
