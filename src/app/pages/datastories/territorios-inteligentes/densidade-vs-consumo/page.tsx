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
    { label: "Territórios Inteligentes: Densidade vs Consumo", url: "/pages/datastories/territorios-inteligentes/densidade-vs-consumo" },
  ];

  const datastory = await getDatastory("territorios-inteligentes/densidade-vs-consumo", "pt");

  return <DatastoryDetails datastory={datastory} breadcrumbItems={breadcrumbItems} />;
}
