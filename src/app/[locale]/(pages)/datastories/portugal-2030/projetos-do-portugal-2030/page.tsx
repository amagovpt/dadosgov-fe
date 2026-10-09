import { Metadata } from "next";
import {
  getDatastorySearchPage,
  getProjectsOfPortugal2030,
  getSearchProjectsPT2030,
} from "@/service/queries/datastories/datastory";
import { Datastory } from "@/components/Shared/Datastories";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import CardBigNumber from "@/components/Shared/CardCompound/CardBigNumber";
import { parseHtmlToParagraphs } from "@/utils/htmlToParagraphs";
import { SearchBenProjStoreProvider } from "@/providers/SearchBenProjProvider";
import { SeachContainer } from "@/components/Shared/SearchBeneficiariesAndProjects/containers";
import DownloadData from "@/components/Shared/SearchBeneficiariesAndProjects/download/DownloadData";
import { Filters } from "@/components/Shared/SearchBeneficiariesAndProjects/filters";
import { Results } from "@/components/Shared/SearchBeneficiariesAndProjects/results";
import HeroContentSearchBenProj from "@/components/Shared/SearchBeneficiariesAndProjects/hero/Search";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { AdvancedFilter } from "@/components/Shared/SearchBeneficiariesAndProjects/filters/AdvancedFilters";
import { QueryProjectsFiltersPt2030, SourceInfo } from "@/service/types/datastories/datastory";
import { RelatedDatastories } from "@/components/Shared/Datastories/Sections/RelatedDatastories";
import Sources from "@/components/Shared/Datastories/Sections/Sources";
import { INoResults } from "@/components/Shared/SearchBeneficiariesAndProjects/results/ResultsPT2030";
import { slugify } from "@/utils/slugify";
import { CardBigNumberProps } from "@/components/Shared/CardCompound/CardBigNumber";

type BigNumberValue = Pick<CardBigNumberProps, "number" | "type" | "unit">;

interface ProjectsTotalsPt2030 {
  total: number;
  filters: { approvedValueMax: number | null; executedValueMax: number | null } | null;
}

// The CMS only sends the big-number labels; the values come from the unfiltered
// projects search (total count plus the approved/executed amounts). On failure
// the section shows only the labels instead of breaking the page.
async function getBigNumberValues(): Promise<BigNumberValue[]> {
  try {
    const { data, error } = await apolloClient.query<{
      searchProjectsOfPortugal2030: ProjectsTotalsPt2030;
    }>({
      query: getProjectsOfPortugal2030(),
      variables: { limit: 1, page: 1 },
    });
    const totals = data?.searchProjectsOfPortugal2030;
    if (!totals || error) throw error ?? new Error("Missing PT2030 projects totals");

    return [
      { number: totals.total, type: "qtd" },
      { number: totals.filters?.approvedValueMax ?? 0, type: "value", unit: "€" },
      { number: totals.filters?.executedValueMax ?? 0, type: "value", unit: "€" },
    ];
  } catch (err) {
    console.error("Error fetching PT2030 projects totals:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const datastorySlug = "portugal-2030/projetos-do-portugal-2030";

  const { hero } = await getDatastorySearchPage(datastorySlug, locale);

  return {
    title: hero.title,
    description: hero.description,
  };
}

export default async function DataStoryProjectsPT2030({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const datastorySlug = "portugal-2030/projetos-do-portugal-2030";

  const [
    {
      hero,
      bigNumberTitle,
      bigNumbers,
      block,
      inputSearch,
      filters,
      sortBy,
      noResults,
      relatedDatasets,
      relatedDatastories,
    },
    bigNumberValues,
  ] = await Promise.all([getDatastorySearchPage(datastorySlug, locale), getBigNumberValues()]);

  const { data, error } = await apolloClient.query<{
    queryBeneficiariesAndProjectsFiltersOfPortugal2030: QueryProjectsFiltersPt2030;
    queryProjectsOfPortugal2030SourceInfo: { sourceInfo: SourceInfo[] };
  }>({
    query: getSearchProjectsPT2030(),
  });

  if (!data || error) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const filtersOptions = flattenData(
    data.queryBeneficiariesAndProjectsFiltersOfPortugal2030 as Record<string, unknown>
  ) as QueryProjectsFiltersPt2030;

  const advFilters: AdvancedFilter[] = filters.map((filter) => {
    let res: AdvancedFilter = {
      label: filter.label,
      name: filter.name,
    };
    if (Object.keys(filtersOptions).includes(filter.name)) {
      res = {
        ...res,
        options:
          filtersOptions[filter.name as keyof QueryProjectsFiltersPt2030].map((option) => ({
            label: option,
            value: option,
            key: option,
          })) || [],
      };
    }
    return res;
  });

  const sourceInfo: SourceInfo[] = data.queryProjectsOfPortugal2030SourceInfo?.sourceInfo || [];

  // flattenData unwraps the `{ url }` asset objects, so `image` arrives as a list of paths
  const noResultsContent: INoResults | undefined = noResults?.[0] && {
    image: (noResults[0].image as unknown as string[] | null)?.[0] ?? "",
    title: noResults[0].title,
    description: noResults[0].description,
  };

  return (
    <main className="datastory-page flex flex-col">
      {/* hero section with index */}
      <Datastory.Hero
        breadcrumbs={hero.breadcrumbs}
        description={hero.description}
        title={hero.title}
        index={hero.index}
        className="[&_.info-datastory]:justify-center"
      />
      {/* ids are the slug of the section title, which is what the CMS index anchors point to */}
      <Section
        id={slugify(bigNumberTitle)}
        className="flex flex-col items-center bg-primary-700 pt-32 pb-64"
      >
        <InfoBlock.Root className="gap-32">
          <InfoBlock.Header>
            <InfoBlock.Title
              title={bigNumberTitle}
              className="max-w-[620px] text-2xl-bold! text-white"
            />
          </InfoBlock.Header>
          <InfoBlock.Content className="xl:grid-cols-3">
            {bigNumbers.map((item, index) => {
              const bigNumber = bigNumberValues[index];
              return (
                <div className="text-white" key={index}>
                  {bigNumber && <CardBigNumber {...bigNumber} locale={locale} />}
                  <span className="text-m-regular">{item}</span>
                </div>
              );
            })}
          </InfoBlock.Content>
        </InfoBlock.Root>
      </Section>
      <SearchBenProjStoreProvider
        subject={"projects"}
        apiRoute="/internal-api/fundos-europeus/pt2030/beneficiarios-e-projetos/pesquisar-projetos"
      >
        <Section id={slugify(block.title)} className="flex flex-col items-center py-64">
          <InfoBlock.Root className="gap-16">
            <InfoBlock.Header>
              <InfoBlock.Title title={block.title} className="max-w-[592px] text-2xl-bold!" />
            </InfoBlock.Header>
            <InfoBlock.Content className="flex flex-col gap-32">
              <InfoBlock.Description
                className="max-w-[592px]"
                description={parseHtmlToParagraphs(block.description)}
              />
              <HeroContentSearchBenProj
                subject={"projects"}
                locale={locale}
                darkMode={false}
                label={inputSearch?.label}
                placeholder={inputSearch?.placeholder}
                showTotal
              />
            </InfoBlock.Content>
          </InfoBlock.Root>
        </Section>
        <Section className="flex w-full flex-col items-center">
          <InfoBlock.Root>
            <InfoBlock.Content className="flex flex-col">
              <SeachContainer.Root>
                <SeachContainer.FiltersAvailable
                  download={<DownloadData className="hidden xl:flex" sourceInfo={sourceInfo} />}
                >
                  <Filters.Indicators />
                  <Filters.Advanced filters={advFilters} locale={locale} showSpecificObjective />
                </SeachContainer.FiltersAvailable>
                <SeachContainer.Content>
                  {/* <Results.Number className="block text-left xl:hidden" /> */}
                  <Filters.Mobile locale={locale}>
                    <Filters.Indicators />
                    <Filters.Advanced filters={advFilters} locale={locale} showSpecificObjective />
                  </Filters.Mobile>
                  <Filters.SortBy options={sortBy} />
                  <Filters.Applied locale={locale} />
                  <Results.PT2030 noResults={noResultsContent} />
                  <Results.Pagination />
                  <DownloadData className="flex xl:hidden" sourceInfo={sourceInfo} />
                </SeachContainer.Content>
              </SeachContainer.Root>
            </InfoBlock.Content>
          </InfoBlock.Root>
        </Section>
      </SearchBenProjStoreProvider>
      {relatedDatastories && relatedDatastories.active !== false && (
        <RelatedDatastories {...relatedDatastories} />
      )}
      {relatedDatasets && relatedDatasets.active !== false && <Sources {...relatedDatasets} />}
    </main>
  );
}
