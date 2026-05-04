import { Metadata } from "next";
import { getDatastory, getDatastoryMetadata } from "@/queries/datastories/datastory";
import DatastoryDetails from "@/components/datastories/DatastoryDetails";
import { BreadcrumbItem } from "@/types/shared";

export async function generateMetadata({
  //params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const datastory = await getDatastoryMetadata(
    "territorios-inteligentes/esperanca-de-vida-em-portugal",
    "pt"
  );

  return {
    title: datastory.title,
    description: datastory.description,
    openGraph: {
      images: datastory.image.map((i)=> i.url),
    },
  };
}

export default async function DataStoryDetailPage({
  //params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Início", url: "/" },
    { label: "Datastories", url: "/pages/datastories" },
    { label: "Territórios Inteligentes: Esperança de vida em Portugal", url: "/pages/datastories/territorios-inteligentes/esperanca-de-vida-em-portugal" },
  ];

  const datastory = await getDatastory(
    "territorios-inteligentes/esperanca-de-vida-em-portugal",
    "pt"
  );

  return <DatastoryDetails datastory={datastory} breadcrumbItems={breadcrumbItems}/>;
}
