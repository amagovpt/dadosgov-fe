import { fetchHomepageData } from "@/services/api";
import HomeClient from "@/components/home/HomeClient";
import { getHome } from "@/queries/home";
import { Datastory } from "@/types/home";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await fetchHomepageData();


  let datastories: Datastory[] = [];
  try {
    const homeData = await getHome("pt");

    datastories = homeData.datastories;
  } catch (error) {
    console.error("Error fetching home data:", error);
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
