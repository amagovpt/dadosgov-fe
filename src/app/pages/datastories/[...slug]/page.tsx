import { Metadata } from "next";
import DatastoryDetailsPage from "@/components/Shared/Datastories/DatastoryDetailsPage";
import { BreadcrumbItem } from "@/service/types/shared/breadcrumbItem";
import { getDatastory, getDatastoryMetadata } from "@/service/queries/datastories/datastory";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const datastorySlug = slug.join("/");

  const datastory = await getDatastoryMetadata(datastorySlug, "pt");

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
  const { slug } = await params;
  const datastorySlug = slug.join("/");

  const datastory = await getDatastory(datastorySlug, "pt");

  let breadcrumbItems: BreadcrumbItem[] = [];
  if (datastory && datastory.hero) {
    breadcrumbItems = [
      { label: "Início", url: "/" },
      { label: "Data Stories", url: "/pages/datastories" },
      {
        label: datastory.hero.title,
        url: `/pages/datastories/${datastorySlug}`,
      },
    ];
  }

  return <DatastoryDetailsPage datastory={datastory} breadcrumbItems={breadcrumbItems} />;
}
