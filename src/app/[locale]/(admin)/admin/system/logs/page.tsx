import type { Metadata } from "next";
import SystemLogsClient from "@/components/admin/logs/SystemLogsClient";
import { getBoLogs, getBoLogsMetadata } from "@/service/queries/admin/logs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoLogsMetadata(locale);

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function SystemLogsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoLogs(locale);

  return <SystemLogsClient pageContent={pageContent} />;
}
