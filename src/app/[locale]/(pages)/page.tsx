import { fetchHomepageData } from "@/service/api/system";
import HomeClient from "@/components/home/HomeClient";
import { getHome } from "@/service/queries/home/home";
import { HomeDatastories, HomeHero, UsedDailyBy } from "@/service/types/home";
import { StatusCard } from "@/service/types/home/home";
import { isWithinDateLimit } from "@/utils/formatDate";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await fetchHomepageData();

  let hero: HomeHero;
  let datastories: HomeDatastories;
  let usedDailyBy: UsedDailyBy[] = [];
  let statusCard: StatusCard = {};
  try {
    const result = await getHome(locale);
    hero = result.hero;
    datastories = result.datastories;
    usedDailyBy = result.usedDailyBy ?? [];
    statusCard = result.statusCard ?? {};
  } catch (error) {
    console.error("Error fetching home data:", error);
    usedDailyBy = [];
    hero = {} as HomeHero;
    datastories = {} as HomeDatastories;
    statusCard = {};
  }

  const showStatusCard = Boolean(statusCard.isActive) && isWithinDateLimit(statusCard.dateLimit);

  return (
    <HomeClient
      HomeHero={hero}
      siteMetrics={data.site_metrics}
      latestDatasets={data.latest_datasets}
      statusCard={showStatusCard ? statusCard : undefined}
      datastories={datastories}
      latestReuses={data.latest_reuses}
      posts={data.latest_posts}
      usedDailyBy={usedDailyBy}
    />
  );
}
