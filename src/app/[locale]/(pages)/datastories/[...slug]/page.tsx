import { Metadata } from "next";
import DatastoryDetailsPage from "@/components/Shared/Datastories/DatastoryDetailsPage";
import { getDatastory, getDatastoryMetadata } from "@/service/queries/datastories/datastory";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const datastorySlug = slug.join("/");

  try {
    const datastory = await getDatastoryMetadata(datastorySlug, "pt");
    return {
      title: datastory.title,
      description: datastory.description,
    };
  } catch (error) {
    // Fall back to the layout's default title rather than failing the whole
    // page render when the CMS is unreachable.
    console.error("Error fetching datastory metadata:", error);
    return {};
  }
}

export default async function DataStoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { slug } = await params;
  const datastorySlug = slug.join("/");

  const datastory = await getDatastory(datastorySlug, "pt");

  return <DatastoryDetailsPage datastory={datastory} />;
}
