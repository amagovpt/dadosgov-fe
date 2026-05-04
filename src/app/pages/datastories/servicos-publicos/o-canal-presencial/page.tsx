import { Metadata } from "next";
import { getDatastory } from "@/queries/datastories/datastory";
import DatastoryDetails from "@/components/datastories/DatastoryDetails";

export const metadata: Metadata = {
  title: "Data Story - dados.gov.pt",
};

export default async function DataStoryDetailPage() {
  const datastory = await getDatastory("servicos-publicos/o-canal-presencial", "pt");

  return <DatastoryDetails datastory={datastory} />;
}
