import initTranslations from "@/app/i18n";
import { BenProjSheet } from "@/components/datastories/BeneficiaryAndProject/Sheet";
import ProjectsList from "@/components/datastories/BeneficiaryAndProjectPt2020/BeneficiarySheet/ProjectsList";
import ButtonGeneral from "@/components/Primitives/Button";
import { Datastory } from "@/components/Shared/Datastories";
import Sources from "@/components/Shared/Datastories/Sections/Sources";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import {
  getPT2020BeneficiaryData,
  getPT2020BeneficiaryMeta,
  queryLoadMorePT2020ProjectsByBeneficiary,
} from "@/service/queries/datastories/datastories-pt2020";
import {
  Beneficiary,
  PT2020BeneficiariesResponse,
  PT2020Beneficiary,
  PT2020ProjectsResponse,
} from "@/service/types/datastories/pt2020/pt2020";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { formatByThree } from "@/utils/formatByThree";
import { formatCompactEUR } from "@/utils/formatCurrency";
import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const { data, error } = await apolloClient.query<{
    findFichaDeBeneficiarioSingleton: { data: unknown };
  }>({
    query: getPT2020BeneficiaryMeta(locale),
  });
  if (!data || error) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }
  const { hero } = flattenData(
    data?.findFichaDeBeneficiarioSingleton.data as Record<string, unknown>
  ) as Beneficiary;

  return {
    title: `${hero?.title}`,
    description: hero?.description,
  };
}

export default async function BeneficiaryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["common"],
  });

  const { data, error } = await apolloClient.query<{
    findFichaDeBeneficiarioSingleton: { data: unknown };
    queryBeneficiarySheetOfPortugal2020: PT2020BeneficiariesResponse;
  }>({
    query: getPT2020BeneficiaryData(locale),
    variables: {
      nif: id,
    },
  });

  if (error || !data) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const { hero, beneficiarySheet, projects, datasets } = flattenData(
    data?.findFichaDeBeneficiarioSingleton.data as Record<string, unknown>
  ) as Beneficiary;

  const { data: beneficiaryData, sourceInfo } = flattenData(
    data?.queryBeneficiarySheetOfPortugal2020 ?? {}
  ) as PT2020Beneficiary;

  const { data: dataMainBen, error: errorMainBen } = await apolloClient.query<{
    queryProjectsByBeneficiarySheetOfPortugal2020: PT2020ProjectsResponse;
  }>({
    query: queryLoadMorePT2020ProjectsByBeneficiary,
    variables: { nif: id, entityRole: "BENEFICIARIO_PRINCIPAL", page: 1 },
  });

  if (errorMainBen || !dataMainBen) {
    console.error("Error:", errorMainBen);
    throw new Error(errorMainBen?.message ?? "Failed to fetch data");
  }

  const mainBenProjects = beneficiaryData.values;

  const mainBenProjectjsQuantity = mainBenProjects.length ?? 0;

  const formatValuesWithSuffix = (value: number | string) => {
    const [finValue, finSuffix] = formatCompactEUR(Number(value));
    return `${finValue} ${t(finSuffix)} €`;
  };

  return (
    <main className="datastory-page project-sheet flex flex-col pb-64">
      <Datastory.Hero
        breadcrumbs={[
          ...hero.breadcrumbs,
          {
            url: `/datastories/portugal-2020/beneficiarios-do-portugal-2020/${id}`,
            label: id,
          },
        ]}
        pretitle={hero.title}
        title={beneficiaryData.entityName}
        index={hero.index}
        className="[&_.info-datastory]:justify-center"
      />

      <Section className="flex flex-col items-center gap-32 py-64" id={beneficiarySheet.id}>
        <InfoBlock.Root>
          <InfoBlock.Header className="flex flex-row gap-24">
            <InfoBlock.Title
              title={beneficiarySheet.title}
              className="max-w-[592px] text-2xl-bold!"
            />
          </InfoBlock.Header>
        </InfoBlock.Root>

        <BenProjSheet.Root>
          <BenProjSheet.List>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.ben_name")}
                value={beneficiaryData.beneficiarySheet[0].entityName}
              />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.nif")}
                value={formatByThree(beneficiaryData.beneficiarySheet[0].entityNif)}
              />
            </BenProjSheet.Wrapper>
          </BenProjSheet.List>
          <BenProjSheet.List>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.valor_financiamento")}
                value={formatValuesWithSuffix(beneficiaryData.approvedValue)}
                className="border-b-2 border-b-neutral-200 xl:border-none"
                tooltipText={t("sheetBenProj.fields.valor_financiamento_tooltip")}
              />
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.total_projetos")}
                value={beneficiaryData.beneficiarySheet[0].projectsAmount.toString()}
              />
            </BenProjSheet.Wrapper>
          </BenProjSheet.List>
        </BenProjSheet.Root>
      </Section>

      <Section className="flex flex-col items-center gap-64 bg-neutral-100 pb-64" id={projects.id}>
        <InfoBlock.Root>
          <InfoBlock.Header className="flex flex-row gap-24">
            <InfoBlock.Title title={projects.title} className="max-w-[592px] text-2xl-bold!" />
          </InfoBlock.Header>
        </InfoBlock.Root>

        <InfoBlock.Root>
          <InfoBlock.Content className="flex flex-col gap-64">
            {mainBenProjectjsQuantity > 0 && (
              <div className="flex flex-col gap-32">
                <Typograph tag="h3" className="text-l-bold text-neutral-900">
                  {"title" in projects.cards[0] ? projects.cards[0].title : ""}
                </Typograph>
                <div className="grid grid-cols-12 gap-32">
                  <div className="order-1 col-span-12 grid grid-cols-5 gap-32 xl:order-2 xl:col-span-5">
                    <div className="col-span-12 flex flex-col gap-32 xl:col-span-3 xl:col-start-2">
                      <BenProjSheet.CardLined
                        title={mainBenProjectjsQuantity.toString()}
                        description={t("projects")}
                        className="items-center border-t-4 border-l-0 border-t-primary-600"
                      />
                      <Link href={projects.cards[1].anchor.href ?? "#"}>
                        <ButtonGeneral
                          fullWidth
                          hasIcon
                          trailingIcon={projects.cards[1].anchor.icon ?? ""}
                          trailingIconHover={projects.cards[1].anchor.icon ?? ""}
                          appearance="link"
                          variant="neutral"
                        >
                          {"anchor" in projects.cards[1] ? projects.cards[1].anchor.children : ""}
                        </ButtonGeneral>
                      </Link>
                    </div>
                  </div>
                  <div className="order-2 col-span-12 xl:order-1 xl:col-span-7">
                    <div className="flex flex-col gap-32">
                      <ProjectsList
                        data={dataMainBen.queryProjectsByBeneficiarySheetOfPortugal2020.data ?? []}
                        total={dataMainBen.queryProjectsByBeneficiarySheetOfPortugal2020.total}
                        nif={id}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </InfoBlock.Content>
        </InfoBlock.Root>
      </Section>

      {datasets && datasets.active !== false && <Sources {...datasets} className="mt-64 p-0" />}
    </main>
  );
}
