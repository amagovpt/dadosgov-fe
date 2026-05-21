import { fetchHomepageData } from "@/app/api/system";
import HomeClient from "@/components/home/HomeClient";
import { getHome } from "@/service/queries/home/home";
import { Datastory, UsedDailyBy } from "@/service/types/home";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await fetchHomepageData();


  let datastories: Datastory[] = [];
  let usedDailyBy: UsedDailyBy[] = [];
  try {
    const result = await getHome("pt");
    datastories = result.datastories;
    usedDailyBy = result.usedDailyBy;
  } catch (error) {
    console.error("Error fetching home data:", error);
    // Fallback: use empty array if any datastory fails to load
    usedDailyBy = [];
    datastories = [];
  }

  return (
    <HomeClient
      siteMetrics={data.site_metrics}
      latestDatasets={data.latest_datasets}
      datastories={datastories}
      latestReuses={data.latest_reuses}
      posts={data.latest_posts}
      usedDailyBy={usedDailyBy}
    />
  );
}
