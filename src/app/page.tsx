import { fetchHomepageData } from "@/services/api";
import HomeClient from "@/components/home/HomeClient";
import { getDatastoryMetadata } from "@/queries/datastories/datastory";
import { DataStoryMetadata } from "@/types/datastories/datastories";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await fetchHomepageData();


  let datastories: DataStoryMetadata[] = [];
  try {
    const datastory1 = await getDatastoryMetadata(
      "territorios-inteligentes/densidade-vs-consumo",
      "pt"
    );
    const datastory2 = await getDatastoryMetadata(
      "servicos-publicos/o-canal-presencial",
      "pt"
    );
    const datastory3 = await getDatastoryMetadata(
      "territorios-inteligentes/pressao-turistica-em-portugal",
      "pt"
    );

    datastories = [datastory1, datastory2, datastory3];

  } catch (error) {
    console.error("Error fetching datastories metadata:", error);
    // Fallback: use empty array if any datastory fails to load
    datastories = [];
  }



  return (
    <HomeClient
      siteMetrics={data.site_metrics}
      latestDatasets={data.latest_datasets}
      datastories={datastories}
      latestReuses={data.latest_reuses}
      posts={data.latest_posts}
    />
  );
}
