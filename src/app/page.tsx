import { fetchHomepageData } from "@/services/api";
import HomeClient from "@/components/home/HomeClient";

export default async function Home() {
  const data = await fetchHomepageData();

  return (
    <HomeClient
      siteMetrics={data.site_metrics}
      latestDatasets={data.latest_datasets}
      latestReuses={data.latest_reuses}
      posts={data.latest_posts}
    />
  );
}
