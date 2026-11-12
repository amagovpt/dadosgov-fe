import { Metadata } from "next";
import initTranslations from "@/app/i18n";
import { Hero } from "@/components/Shared/Hero";
import { UserGuidesIndexClient } from "@/components/user-guides/UserGuidesIndexClient";
import { UserGuidesSearchBar } from "@/components/user-guides/UserGuidesSearchBar";
import { getUserGuidesPage } from "@/service/queries/user-guides";
import { formatPortalDate } from "@/utils/formatDate";
import { getAssets } from "@/utils/getAssets";
import { parseHtmlToParagraphs, stripHtmlTags } from "@/utils/htmlToParagraphs";

// The search term lives in the URL and is read client-side, so nothing here forces a dynamic
// render; without this the CMS content would be frozen at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const page = await getUserGuidesPage(locale);
  if (!page.title) return {};

  return {
    title: `${page.title}`,
    description: stripHtmlTags(page.description),
  };
}

export default async function UserGuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = await initTranslations({ locale, namespaces: ["user-guides", "common"] });
  const page = await getUserGuidesPage(locale);

  const heroImage = page.heroImage[0];
  const title = page.title || t("breadcrumbs.guias-do-utilizador", { ns: "common" });
  const updatedAt = page.updatedAt
    ? formatPortalDate(page.updatedAt, "dd.MM.yyyy", locale === "en" ? "en" : "pt")
    : "";

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <Hero.Root backgroundImageUrl={heroImage ? getAssets(heroImage.id) : undefined}>
        <Hero.Breadcrumb />
        <Hero.Content>
          <Hero.Title>{title}</Hero.Title>
          {page.description && (
            <Hero.Description description={parseHtmlToParagraphs(page.description)} />
          )}
        </Hero.Content>
        <Hero.Actions>
          <UserGuidesSearchBar
            label={page.searchLabel || t("searchLabel")}
            placeholder={page.searchPlaceholder || t("searchPlaceholder")}
            searchActionAltText={t("searchAction")}
          />
          {updatedAt && (
            <p className="mt-32 text-s-regular text-white">
              {t("updatedAt", { ns: "common", date: updatedAt })}
            </p>
          )}
        </Hero.Actions>
      </Hero.Root>
      <UserGuidesIndexClient themes={page.themes} />
    </main>
  );
}
