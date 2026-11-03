import { Metadata } from "next";
import {
    getDimensionPage,
    getResilienceDimensionData,
} from "@/service/queries/datastories/datastory";
import { getTechnicalSheetData } from "@/service/queries/modal/technical-sheet";
import { Datastory } from "@/components/Shared/Datastories";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import CardBigNumber from "@/components/Shared/CardCompound/CardBigNumber";
import { RelatedDatastories } from "@/components/Shared/Datastories/Sections/RelatedDatastories";
import Sources from "@/components/Shared/Datastories/Sections/Sources";
import { InvestmentsAndReformsDetail } from "@/components/datastories/DimensionPrr/InvestmentsAndReformsDetail";
import { getRelatedDatasets } from "@/service/api/datasets/server";
import apolloClient from "@/service/utils/apollo-client";
import {
    DimensionDetails,
    DimensionInNumbers,
    DimensionInvestmentCategory,
    DimensionReformCategory,
    DimensionTextBlock,
} from "@/service/types/datastories/prr/prr";
import { TechnicalSheetModalData } from "@/service/types/modal/technical-sheet";
import {
    buildDimensionSourceInfo,
    buildInvestmentCategories,
    buildReformCategories,
    DimensionDetailCategory,
} from "@/lib/prr/dimensions";
import { SourceInfoFooterProps } from "@/components/Shared/SourceInfoFooter";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { parseHtmlToParagraphs } from "@/utils/htmlToParagraphs";

const DATASTORY_SLUG = "prr/dimensao-resiliencia";
const INVESTMENTS_TECHNICAL_SHEET = "prr-dimensao-resiliencia-investimentos";
const REFORMS_TECHNICAL_SHEET = "prr-dimensao-resiliencia-reformas";

interface DimensionDetailSection {
    categories: DimensionDetailCategory[];
    sourceInfo?: SourceInfoFooterProps;
}

interface ResilienceDimensionData {
    numbers: number[];
    investments: DimensionDetailSection;
    reforms: DimensionDetailSection;
}

const EMPTY_DIMENSION_DATA: ResilienceDimensionData = {
    numbers: [],
    investments: { categories: [] },
    reforms: { categories: [] },
};

async function getOptionalTechnicalSheet(
    slug: string,
    locale: string
): Promise<TechnicalSheetModalData | undefined> {
    try {
        return await getTechnicalSheetData(slug, locale);
    } catch {
        return undefined;
    }
}

async function getResilienceDimension(locale: string): Promise<ResilienceDimensionData> {
    try {
        const [{ data, error }, investmentsSheet, reformsSheet] = await Promise.all([
            apolloClient.query<{
                queryResiliencyInNumbers: DimensionInNumbers;
                queryInvestmentInDetailsDimensionResiliency: DimensionDetails<DimensionInvestmentCategory>;
                queryReformsInDetailsDimensionResiliency: DimensionDetails<DimensionReformCategory>;
            }>({
                query: getResilienceDimensionData(),
            }),
            getOptionalTechnicalSheet(INVESTMENTS_TECHNICAL_SHEET, locale),
            getOptionalTechnicalSheet(REFORMS_TECHNICAL_SHEET, locale),
        ]);
        if (!data || error) throw error ?? new Error("Missing PRR resilience dimension data");

        const numbers = data.queryResiliencyInNumbers;
        const investments = data.queryInvestmentInDetailsDimensionResiliency;
        const reforms = data.queryReformsInDetailsDimensionResiliency;

        return {
            numbers: numbers
                ? [numbers.totalInvestmentPrr, numbers.allocatedFundsDimension, numbers.fundsSpentDimension]
                : [],
            investments: {
                categories: buildInvestmentCategories(investments?.data, locale),
                sourceInfo: buildDimensionSourceInfo(investments?.sourceInfo, investmentsSheet),
            },
            reforms: {
                categories: buildReformCategories(reforms?.data, locale),
                sourceInfo: buildDimensionSourceInfo(reforms?.sourceInfo, reformsSheet),
            },
        };
    } catch (err) {
        console.error("Error fetching PRR resilience dimension data:", err);
        return EMPTY_DIMENSION_DATA;
    }
}

function DetailSection({
    id,
    block,
    detail,
    type,
}: {
    id: string;
    block: DimensionTextBlock;
    detail: DimensionDetailSection;
    type: "investments" | "reforms";
}) {
    if (!block?.title || detail.categories.length === 0) return null;

    return (
        <Section id={id} className="flex flex-col items-center py-64">
            <InfoBlock.Root className="gap-32">
                <InfoBlock.Header>
                    <InfoBlock.Title title={block.title} className="max-w-[592px] text-2xl-bold!" />
                </InfoBlock.Header>
                <InfoBlock.Content className="flex flex-col gap-32">
                    {block.description && (
                        <InfoBlock.Description
                            className="max-w-[592px]"
                            description={parseHtmlToParagraphs(block.description)}
                        />
                    )}
                    <InvestmentsAndReformsDetail
                        categories={detail.categories}
                        type={type}
                        sourceInfo={detail.sourceInfo}
                    />
                </InfoBlock.Content>
            </InfoBlock.Root>
        </Section>
    );
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;

    const { hero } = await getDimensionPage(DATASTORY_SLUG, locale);

    return {
        title: hero.title,
        description: hero.description,
    };
}

export default async function DataStoryResilienceDimensionPRR({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const [
        {
            hero,
            dimensionInNumbers,
            bigNumbers,
            investmentsInDetail,
            reformsInDetail,
            relatedDatastories,
            relatedDatasets,
        },
        { numbers, investments, reforms },
        prrDatasets,
    ] = await Promise.all([
        getDimensionPage(DATASTORY_SLUG, locale),
        getResilienceDimension(locale),
        getRelatedDatasets("prr"),
    ]);



    return (
        <main className="datastory-page flex flex-col">
            <Datastory.Hero
                breadcrumbs={hero.breadcrumbs}
                description={hero.description}
                title={hero.title}
                index={hero.index}
                className="[&_.info-datastory]:justify-center"
            />
            {numbers.length > 0 && (
                <Section
                    id={hero.index.anchors[0].href.replace("#", "")}
                    className="flex flex-col items-center bg-primary-700 pt-32 pb-64"
                >
                    <InfoBlock.Root className="gap-32">
                        <InfoBlock.Header>
                            <InfoBlock.Title
                                title={dimensionInNumbers}
                                className="max-w-[620px] text-2xl-bold! text-white"
                            />
                        </InfoBlock.Header>
                        <InfoBlock.Content className="xl:grid-cols-3">
                            {bigNumbers.map((item, index) => (
                                <div className="text-white" key={index}>
                                    {numbers[index] !== undefined && (
                                        <CardBigNumber number={numbers[index]} type="value" unit="€" locale={locale} />
                                    )}
                                    <div className="text-m-regular">{formatHtmlParagraphs(item)}</div>
                                </div>
                            ))}
                        </InfoBlock.Content>
                    </InfoBlock.Root>
                </Section>
            )}
            <DetailSection id={hero.index.anchors[1].href.replace("#", "")} block={investmentsInDetail} detail={investments} type="investments" />
            <DetailSection id={hero.index.anchors[2].href.replace("#", "")} block={reformsInDetail} detail={reforms} type="reforms" />
            {relatedDatastories &&
                relatedDatastories.active !== false &&
                relatedDatastories.datastories?.length > 0 && (
                <RelatedDatastories
                    {...relatedDatastories}
                    id={hero.index.anchors[3].href.replace("#", "")}
                />
            )}
            {relatedDatasets && relatedDatasets.active !== false && prrDatasets.length > 0 && (
                <Sources
                    {...relatedDatasets}
                    id={hero.index.anchors[4].href.replace("#", "")}
                    datasets={prrDatasets}
                    pageSize={6}
                    fromCatalog
                />
            )}
        </main>
    );
}
