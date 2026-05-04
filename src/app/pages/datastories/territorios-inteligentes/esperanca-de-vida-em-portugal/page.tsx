import { Metadata } from "next";
import { getDatastory } from "@/queries/datastories/datastory";
import DatastoryDetails from "@/components/datastories/DatastoryDetails";

export const metadata: Metadata = {
  title: "Data Story - dados.gov.pt",
};

export default async function DataStoryDetailPage() {
  const datastory = await getDatastory(
    "territorios-inteligentes/esperanca-de-vida-em-portugal",
    "pt"
  );

  return <DatastoryDetails datastory={datastory} />;
}
