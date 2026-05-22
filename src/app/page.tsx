import { fetchHomepageData } from "@/services/api";
import HomeClient from "@/components/home/HomeClient";
import { getHome } from "@/queries/home";
import { Datastory, UsedDailyBy } from "@/types/home";
import { probeUrls } from "@/lib/imageProbe";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await fetchHomepageData();

  const reachableLogos = await probeUrls(
    data.latest_datasets.map((d) => d.organization?.logo)
  );
  data.latest_datasets = data.latest_datasets.map((d) => {
    if (d.organization?.logo && !reachableLogos.has(d.organization.logo)) {
      return { ...d, organization: { ...d.organization, logo: null } };
    }
    return d;
  });

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
