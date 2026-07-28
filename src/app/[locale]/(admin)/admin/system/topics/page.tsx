import type { Metadata } from "next";
import SystemTopicsClient from "@/components/admin/topics/SystemTopicsClient";
import { getBoTopics, getBoTopicsMetadata } from "@/service/queries/admin/topics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoTopicsMetadata(locale);

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function SystemTopicsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoTopics(locale);

  return <SystemTopicsClient pageContent={pageContent} />;
}
