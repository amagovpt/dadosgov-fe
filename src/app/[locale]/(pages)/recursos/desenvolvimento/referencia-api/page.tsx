import ApiTutorialClient from "@/components/documentation/ApiTutorialClient";
import {
  getApiReferenceMetadata,
  getApiReferencePage,
} from "@/service/queries/documentation/api-reference";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getApiReferenceMetadata(locale);

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function ApiDocumentationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getApiReferencePage(locale);

  return <ApiTutorialClient page={page} />;
}
