import type { Metadata } from "next";
import SystemEditorialClient from "@/components/admin/editorial/SystemEditorialClient";
import { getBoEditorial, getBoEditorialMetadata } from "@/service/queries/admin/editorial";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoEditorialMetadata(locale);

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function SystemEditorialPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoEditorial(locale);

  return <SystemEditorialClient pageContent={pageContent} />;
}
