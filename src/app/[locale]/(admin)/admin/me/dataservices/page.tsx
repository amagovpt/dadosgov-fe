import type { Metadata } from "next";
import { getBoDataservices, getBoDataservicesMetadata } from "@/service/queries/admin/dataservices";
import DataservicesClient from "@/components/admin/dataservices/views/DataservicesClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDataservicesMetadata(locale, "myListMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function DataservicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDataservices(locale);

  return <DataservicesClient pageContent={pageContent} />;
}
