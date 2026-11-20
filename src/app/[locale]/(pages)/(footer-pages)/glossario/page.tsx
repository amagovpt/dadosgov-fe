import { Metadata } from "next";
import initTranslations from "@/app/i18n";
import { Hero } from "@/components/Shared/Hero";
import { GlossaryClient } from "@/components/glossary/GlossaryClient";
import { getGlossaryPage } from "@/service/queries/glossary";
import { parseHtmlToParagraphs } from "@/utils/htmlToParagraphs";

export const dynamic = "force-dynamic";

interface GlossaryPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pesquisar?: string | string[] }>;
}

/** CMS hero, falling back to the translated defaults while the singleton is not filled in. */
async function getHero(locale: string) {
  const [{ hero, glossary }, { t }] = await Promise.all([
    getGlossaryPage(locale),
    initTranslations({ locale, namespaces: ["common"] }),
  ]);
  return {
    glossary,
    hero: {
      title: hero.title || t("glossary.title"),
      subtitle: hero.subtitle || t("glossary.subtitle"),
    },
  };
}

export async function generateMetadata({ params }: GlossaryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { hero } = await getHero(locale);

  return {
    title: hero.title,
    description: hero.subtitle,
  };
}

export default async function GlossaryPage({ params, searchParams }: GlossaryPageProps) {
  const { locale } = await params;
  const { pesquisar } = await searchParams;
  const initialQuery = Array.isArray(pesquisar) ? (pesquisar[0] ?? "") : (pesquisar ?? "");
  const { hero, glossary } = await getHero(locale);

  return (
    <main className="flex h-full w-full flex-col items-center justify-center">
      <Hero.Root backgroundImageUrl={"/Banner/hero-bg.jpg"} hasMinHeight={false}>
        <Hero.Breadcrumb />
        <Hero.Content>
          <Hero.Title>{hero.title}</Hero.Title>
          {/* <Hero.Description description={parseHtmlToParagraphs(hero.subtitle)} /> */}
        </Hero.Content>
      </Hero.Root>

      <GlossaryClient entries={glossary} initialQuery={initialQuery} />
    </main>
  );
}
