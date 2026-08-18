import { fetchHomepageData } from "@/service/api/system";
import HomeClient from "@/components/home/HomeClient";
import { getHome } from "@/service/queries/home/home";
import { HomeDatastories, HomeHero, UsedDailyBy } from "@/service/types/home";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await fetchHomepageData();

  let hero: HomeHero;
  let datastories: HomeDatastories;
  let usedDailyBy: UsedDailyBy[] = [];
  try {
    const result = await getHome(locale);
    hero = result.hero;
    datastories = result.datastories;
    usedDailyBy = result.usedDailyBy ?? [];
  } catch (error) {
    console.error("Error fetching home data:", error);
    usedDailyBy = [];
    hero = {} as HomeHero;
    datastories = {} as HomeDatastories;
  }

  return (
    <HomeClient
      HomeHero={hero}
      siteMetrics={data.site_metrics}
      latestDatasets={data.latest_datasets}
      datastories={datastories}
      latestReuses={data.latest_reuses}
      posts={data.latest_posts}
      usedDailyBy={usedDailyBy}
    />
  );
}
