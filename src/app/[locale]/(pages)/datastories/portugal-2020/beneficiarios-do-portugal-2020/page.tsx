import { Metadata } from "next";
import { getDatastorySearchPage } from "@/service/queries/datastories/datastories-eu-funds";
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
import { RelatedDatastories } from "@/components/Shared/Datastories/Sections/RelatedDatastories";
import Sources from "@/components/Shared/Datastories/Sections/Sources";
import { getRelatedDatasets } from "@/service/api/datasets/server";
import { slugify } from "@/utils/slugify";
import { CardBigNumberProps } from "@/components/Shared/CardCompound/CardBigNumber";
import { TypeOption } from "@/components/Shared/SearchBeneficiariesAndProjects/filters/TypesOfBeneficiaries";
import { getBeneficiariesOfPortugal2020, getSearchBeneficiariesPT2020 } from "@/service/queries/datastories/datastories-pt2020";
import { QueryFiltersPt2020, SourceInfo } from "@/service/types/datastories/pt2020/pt2020";
import { INoResults } from "@/components/Shared/SearchBeneficiariesAndProjects/results/ResultsShared";

type BigNumberValue = Pick<CardBigNumberProps, "number" | "type" | "unit">;

interface BeneficiariesTotalsPt2020 {
  total: number;
  filters: { approvedValueMax: number | null; executedValueMax: number | null } | null;
}

// The CMS only sends the big-number labels; the values come from the unfiltered
// beneficiaries search (total count plus the approved/executed amounts). On failure
// the section shows only the labels instead of breaking the page.
async function getBigNumberValues(): Promise<BigNumberValue[]> {
  try {
    const { data, error } = await apolloClient.query<{
      searchBeneficiariesOfPortugal2020: BeneficiariesTotalsPt2020;
    }>({
      query: getBeneficiariesOfPortugal2020(),
      variables: { limit: 1, page: 1 },
    });
    const totals = data?.searchBeneficiariesOfPortugal2020;
    if (!totals || error) throw error ?? new Error("Missing PT2020 beneficiaries totals");

    return [
      { number: totals.total, type: "qtd" },
      { number: totals.filters?.approvedValueMax ?? 0, type: "value", unit: "€" },
      { number: totals.filters?.executedValueMax ?? 0, type: "value", unit: "€" },
    ];
  } catch (err) {
    console.error("Error fetching PT2020 beneficiaries totals:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const datastorySlug = "portugal-2020/beneficiarios-do-portugal-2020";

  const { hero } = await getDatastorySearchPage(datastorySlug, locale);

  return {
    title: hero.title,
    description: hero.description,
  };
}

export default async function DataStoryBeneficiariesPT2020({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const datastorySlug = "portugal-2020/beneficiarios-do-portugal-2020";

  const [
    {
      hero,
      bigNumberTitle,
      bigNumbers,
      block,
      inputSearch,
      typesOfBeneficiariesTitle,
      typesOfBeneficiaries,
      filters,
      sortBy,
      noResults,
      relatedDatasets,
      relatedDatastories,
    },
    bigNumberValues,
    pt2020Datasets,
  ] = await Promise.all([
    getDatastorySearchPage(datastorySlug, locale),
    getBigNumberValues(),
    getRelatedDatasets("pt2020"),
  ]);

  const { data, error } = await apolloClient.query<{
    queryBeneficiariesAndProjectsFiltersOfPortugal2020: QueryFiltersPt2020;
    queryBeneficiariesOfPortugal2020SourceInfo: { sourceInfo: SourceInfo[] };
  }>({
    query: getSearchBeneficiariesPT2020(),
  });

  if (!data || error) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const typesOfBenOptions: TypeOption[] =
    typesOfBeneficiaries?.map((type) => ({
      name: type.name,
      title: type.title,
      subtitle: type.description ?? "",
    })) ?? [];

  const filtersOptions = flattenData(
    data.queryBeneficiariesAndProjectsFiltersOfPortugal2020 as Record<string, unknown>
  ) as QueryFiltersPt2020;

  const advFilters: AdvancedFilter[] = filters.map((filter) => {
    let res: AdvancedFilter = {
      label: filter.label,
      name: filter.name,
    };
    if (Object.keys(filtersOptions).includes(filter.name)) {
      res = {
        ...res,
        options:
          filtersOptions[filter.name as keyof QueryFiltersPt2020].map((option) => ({
            label: option,
            value: option,
            key: option,
          })) || [],
      };
    }
    return res;
  });

  const sourceInfo: SourceInfo[] =
    data.queryBeneficiariesOfPortugal2020SourceInfo?.sourceInfo || [];

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
        subject={"beneficiaries"}
        apiRoute="/internal-api/fundos-europeus/pt2030/beneficiarios-e-projetos/pesquisar-beneficiarios"
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
                subject={"beneficiaries"}
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
                    <Filters.Advanced filters={advFilters} locale={locale} showSpecificObjective />
                  </Filters.Mobile>
                  <Filters.SortBy options={sortBy} />
                  <Filters.Applied locale={locale} />
                  <Results.PT2020 noResults={noResultsContent} />
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
      {relatedDatasets && relatedDatasets.active !== false && pt2020Datasets.length > 0 && (
        <Sources {...relatedDatasets} datasets={pt2020Datasets} pageSize={6} fromCatalog />
      )}
    </main>
  );
}
