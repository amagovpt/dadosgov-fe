import type { Metadata } from "next";
import { getBoDataservices, getBoDataservicesMetadata } from "@/service/queries/admin/dataservices";
import SystemDataservicesClient from "@/components/admin/dataservices/views/SystemDataservicesClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDataservicesMetadata(locale, "systemMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function SystemDataservicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDataservices(locale);

  return <SystemDataservicesClient pageContent={pageContent} />;
}
