import SupportPage from "@/components/ajuda-e-contactos/SupportPage";
import { getSupportPage, getSupportPageMetadata } from "@/service/queries/support";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getSupportPageMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default async function SupportPageWrapper({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getSupportPage(locale);

  return <SupportPage locale={locale} pageContent={pageContent} />;
}
