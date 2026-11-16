import { Metadata } from "next";
import DatastoryDetailsPage from "@/components/Shared/Datastories/DatastoryDetailsPage";
import { getDatastory, getDatastoryMetadata } from "@/service/queries/datastories/datastory";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const datastorySlug = slug.join("/");

  const datastory = await getDatastoryMetadata(datastorySlug, locale);

  return {
    title: datastory.title,
    description: datastory.description,
  };
}

export default async function DataStoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { slug, locale } = await params;
  const datastorySlug = slug.join("/");

  const datastory = await getDatastory(datastorySlug, locale);

  return <DatastoryDetailsPage datastory={datastory} />;
}
