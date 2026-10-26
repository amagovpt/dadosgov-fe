import { Metadata } from "next";
import {
  getBeneficiariesOfPRR,
  getDatastorySearchPage,
  getSearchBeneficiariesPRR,
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
import { AdvancedFilter } from "@/components/Shared/SearchBeneficiariesAndProjects/filters/AdvancedFilters";
import { SourceInfo } from "@/service/types/datastories/pt2030/pt2030";
import {
  PRRSearchBeneficiariesResponse,
  QueryBeneficiariesFiltersPrr,
  QueryFiltersPrr,
} from "@/service/types/datastories/prr/prr";
import { RelatedDatastories } from "@/components/Shared/Datastories/Sections/RelatedDatastories";
import Sources from "@/components/Shared/Datastories/Sections/Sources";
import { INoResults } from "@/components/Shared/SearchBeneficiariesAndProjects/results/ResultsPRR";
import { slugify } from "@/utils/slugify";
import { toSortedUnique } from "@/utils/toSortedUnique";
import { CardBigNumberProps } from "@/components/Shared/CardCompound/CardBigNumber";
import { TypeOption } from "@/components/Shared/SearchBeneficiariesAndProjects/filters/TypesOfBeneficiaries";

const DATASTORY_SLUG = "prr/beneficiarios-do-prr";

const API_ROUTE =
  "/internal-api/fundos-europeus/plano-de-recuperacao-e-resiliencia/beneficiarios-e-projetos/pesquisar-beneficiarios";

type BigNumberValue = Pick<CardBigNumberProps, "number" | "type" | "unit">;

async function getBigNumberValues(): Promise<BigNumberValue[]> {
  try {
    const { data, error } = await apolloClient.query<{
      searchBeneficiariesOfPRR: Pick<PRRSearchBeneficiariesResponse, "total" | "filters">;
    }>({
      query: getBeneficiariesOfPRR(),
      variables: { limit: 1, page: 1 },
    });
    const totals = data?.searchBeneficiariesOfPRR;
    if (!totals || error) throw error ?? new Error("Missing PRR beneficiaries totals");

    return [
      { number: totals.total, type: "qtd" },
      { number: totals.filters?.budgetMax ?? 0, type: "value", unit: "€" },
      { number: totals.filters?.paidBudgetMax ?? 0, type: "value", unit: "€" },
    ];
  } catch (err) {
    console.error("Error fetching PRR beneficiaries totals:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const { hero } = await getDatastorySearchPage(DATASTORY_SLUG, locale);

  return {
    title: hero.title,
    description: hero.description,
  };
}

export default async function DataStoryBeneficiariesPRR({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

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
  ] = await Promise.all([getDatastorySearchPage(DATASTORY_SLUG, locale), getBigNumberValues()]);

  const { data, error } = await apolloClient.query<{
    queryBeneficiariesAndProjectsFiltersOfPRR: QueryFiltersPrr;
    queryBeneficiarySourceInfoOfPRR: { sourceInfo: SourceInfo[] };
  }>({
    query: getSearchBeneficiariesPRR(),
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

  const prrFilters = data.queryBeneficiariesAndProjectsFiltersOfPRR;
  const filtersOptions: QueryBeneficiariesFiltersPrr = {
    dimensions: toSortedUnique(prrFilters?.dimensions ?? []),
    regions: toSortedUnique(prrFilters?.regions ?? []),
    municipalities: toSortedUnique(prrFilters?.municipalities ?? []),
    amounts: [],
    projectsAmount: [],
  };

  const advFilters: AdvancedFilter[] = filters.map((filter) => {
    let res: AdvancedFilter = {
      label: filter.label,
      name: filter.name,
    };
    if (Object.keys(filtersOptions).includes(filter.name)) {
      res = {
        ...res,
        options:
          filtersOptions[filter.name as keyof QueryBeneficiariesFiltersPrr].map((option) => ({
            label: option,
            value: option,
            key: option,
          })) || [],
      };
    }
    return res;
  });

  const sourceInfo: SourceInfo[] = data.queryBeneficiarySourceInfoOfPRR?.sourceInfo || [];

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
      <SearchBenProjStoreProvider subject={"beneficiaries"} apiRoute={API_ROUTE}>
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
                  <Filters.TypesOfBen
                    title={typesOfBeneficiariesTitle}
                    options={typesOfBenOptions}
                    locale={locale}
                  />
                  {/* PRR has no executed amount per beneficiary, only the budget and paid */}
                  <Filters.Indicators includeExecuted={false} />
                  <Filters.Advanced filters={advFilters} locale={locale} />
                </SeachContainer.FiltersAvailable>
                <SeachContainer.Content>
                  {/* <Results.Number className="block text-left xl:hidden" /> */}
                  <Filters.Mobile locale={locale}>
                    <Filters.TypesOfBen
                      title={typesOfBeneficiariesTitle}
                      options={typesOfBenOptions}
                      locale={locale}
                    />
                    <Filters.Indicators includeExecuted={false} />
                    <Filters.Advanced filters={advFilters} locale={locale} />
                  </Filters.Mobile>
                  <Filters.SortBy options={sortBy} />
                  <Filters.Applied locale={locale} />
                  <Results.PRR noResults={noResultsContent} />
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
