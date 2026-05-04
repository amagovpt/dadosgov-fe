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
    { label: "Territórios Inteligentes: Pressão turística em Portugal", url: "/pages/datastories/territorios-inteligentes/pressao-turistica-em-portugal" },
  ];

  const datastory = await getDatastory(
    "territorios-inteligentes/pressao-turistica-em-portugal",
    "pt"
  );

  return <DatastoryDetails datastory={datastory} breadcrumbItems={breadcrumbItems} />;
}
