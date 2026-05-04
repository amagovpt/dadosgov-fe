import { Metadata } from "next";
import { getDatastory } from "@/queries/datastories/datastory";
import DatastoryDetails from "@/components/datastories/DatastoryDetails";
import { BreadcrumbItem } from "@/types/shared";

export const metadata: Metadata = {
  title: "Data Story - dados.gov.pt",
};

export default async function DataStoryDetailPage() {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Início", url: "/" },
    { label: "Datastories", url: "/pages/datastories" },
    { label: "Servicos Públicos: O canal presencial", url: "/pages/datastories/servicos-publicos/o-canal-presencial" },
  ];

  const datastory = await getDatastory("servicos-publicos/o-canal-presencial", "pt");

  return <DatastoryDetails datastory={datastory} breadcrumbItems={breadcrumbItems} />;
}
