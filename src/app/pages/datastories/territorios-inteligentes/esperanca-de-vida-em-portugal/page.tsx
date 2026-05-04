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
    { label: "Territórios Inteligentes: Esperança de vida em Portugal", url: "/pages/datastories/territorios-inteligentes/esperanca-de-vida-em-portugal" },
  ];

  const datastory = await getDatastory(
    "territorios-inteligentes/esperanca-de-vida-em-portugal",
    "pt"
  );

  return <DatastoryDetails datastory={datastory} breadcrumbItems={breadcrumbItems}/>;
}
