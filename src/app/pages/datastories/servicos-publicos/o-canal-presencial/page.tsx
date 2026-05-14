import { Metadata } from "next";
import { getDatastory, getDatastoryMetadata } from "@/queries/datastories/datastory";
import DatastoryDetails from "@/components/datastories/DatastoryDetails";
import { BreadcrumbItem } from "@/types/shared";


export async function generateMetadata({
  //params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const datastory = await getDatastoryMetadata("servicos-publicos/o-canal-presencial", "pt");

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
    { label: "Data Stories", url: "/pages/datastories" },
    { label: "Serviços públicos: canal presencial", url: "/pages/datastories/servicos-publicos/o-canal-presencial" },
  ];

  const datastory = await getDatastory("servicos-publicos/o-canal-presencial", "pt");

  return <DatastoryDetails datastory={datastory} breadcrumbItems={breadcrumbItems} />;
}
