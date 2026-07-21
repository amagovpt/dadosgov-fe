import type { Metadata } from "next";
import { getBoDataservices, getBoDataservicesMetadata } from "@/service/queries/admin/dataservices";
import DataservicesEditClient from "@/components/admin/dataservices/views/DataservicesEditClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDataservicesMetadata(locale, "editMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function DataservicesEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDataservices(locale);

  return <DataservicesEditClient pageContent={pageContent} />;
}
