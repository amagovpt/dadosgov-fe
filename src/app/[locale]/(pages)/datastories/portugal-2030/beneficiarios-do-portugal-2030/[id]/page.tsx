import initTranslations from "@/app/i18n";
import ProjectsByEntityList from "@/components/datastories/BeneficiaryAndProject/BeneficiarySheet/ProjectsByEntityList";
import { BenProjSheet } from "@/components/datastories/BeneficiaryAndProject/Sheet";
import ButtonGeneral from "@/components/Primitives/Button";
import RoundedIcon from "@/components/Primitives/RoundedIcon";
import { Datastory } from "@/components/Shared/Datastories";
import Sources from "@/components/Shared/Datastories/Sections/Sources";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import { SourceInfoFooter } from "@/components/Shared/SourceInfoFooter";
import {
  getPT2030BeneficiaryData,
  getPT2030BeneficiaryMeta,
  queryLoadMorePT2030ProjectsByBeneficiary,
} from "@/service/queries/datastories/datastory";
import { getTechnicalSheetData } from "@/service/queries/modal/technical-sheet";
import {
  Beneficiary,
  PT2030BeneficiariesResponse,
  PT2030Beneficiary,
  PT2030ProjectsByBeneficiaryResponse,
} from "@/service/types/datastories/pt2030/pt2030";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { formatByThree } from "@/utils/formatByThree";
import { formatCompactEUR } from "@/utils/formatCurrency";
import { LinkWrapper } from "@ama-pt/agora-design-system";
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
    query: getPT2030BeneficiaryMeta(locale),
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
    queryBeneficiarySheetOfPortugal2030: PT2030BeneficiariesResponse;
  }>({
    query: getPT2030BeneficiaryData(locale),
    variables: {
      nif: id,
    },
  });

  if (error || !data) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const { hero, beneficiarySheet, distribution, projects, datasets } = flattenData(
    data?.findFichaDeBeneficiarioSingleton.data as Record<string, unknown>
  ) as Beneficiary;

  const { data: beneficiaryData, sourceInfo } = flattenData(
    data?.queryBeneficiarySheetOfPortugal2030 ?? {}
  ) as PT2030Beneficiary;

  const { data: dataMainBen, error: errorMainBen } = await apolloClient.query<{
    queryProjectsByBeneficiarySheetOfPortugal2030: PT2030ProjectsByBeneficiaryResponse;
  }>({
    query: queryLoadMorePT2030ProjectsByBeneficiary,
    variables: { nif: id, entityRole: "BENEFICIARIO_PRINCIPAL", page: 1 },
  });

  if (errorMainBen || !dataMainBen) {
    console.error("Error:", errorMainBen);
    throw new Error(errorMainBen?.message ?? "Failed to fetch data");
  }

  const { data: dataOtherBen, error: errorOtherBen } = await apolloClient.query<{
    queryProjectsByBeneficiarySheetOfPortugal2030: PT2030ProjectsByBeneficiaryResponse;
  }>({
    query: queryLoadMorePT2030ProjectsByBeneficiary,
    variables: { nif: id, entityRole: "OUTROS_BENEFICIARIOS", page: 1 },
  });

  if (errorOtherBen || !dataOtherBen) {
    console.error("Error:", errorOtherBen);
    throw new Error(errorOtherBen?.message ?? "Failed to fetch data");
  }

  const benPt2030TechnicalSheet = await getTechnicalSheetData(
    "pt2030-ficha-de-beneficiario",
    locale
  );

  const mainBens = beneficiaryData.valuesByEntityRole.filter(
    (item) => item.entityRole === "Beneficiário Principal"
  );

  const hasMainBen = mainBens.length > 0;

  const mainBen = hasMainBen ? mainBens[0] : null;

  const otherBens = beneficiaryData.valuesByEntityRole.filter(
    (item) => item.entityRole === "Outros Beneficiários"
  );

  const hasOtherBen = otherBens.length > 0;

  const otherBen = hasOtherBen ? otherBens[0] : null;

  const hasOnlyOneTypeOfBen = (hasMainBen && !hasOtherBen) || (!hasMainBen && hasOtherBen);

  const mainBenProjects = beneficiaryData.numberOfProjectsByEntityRole.filter(
    (item) => item.entityRole === "Beneficiário Principal"
  );

  const mainBenProjectjsQuantity =
    mainBenProjects.length > 0 ? mainBenProjects[0].projectsAmount : 0;

  const otherBenProjects = beneficiaryData.numberOfProjectsByEntityRole.filter(
    (item) => item.entityRole === "Outros Beneficiários"
  );

  const otherBenProjectjsQuantity =
    otherBenProjects.length > 0 ? otherBenProjects[0].projectsAmount : 0;

  const formatValuesWithSuffix = (value: number | string) => {
    const [finValue, finSuffix] = formatCompactEUR(Number(value));
    return `${finValue} ${t(finSuffix)} €`;
  };

  const buildProjectsSearchHref = (
    baseHref: string,
    projects?: Array<{ operationCode?: string | null }>
  ) => {
    if (!projects?.length) {
      return baseHref;
    }

    const params = new URLSearchParams();

    projects.forEach((project) => {
      if (project.operationCode) {
        params.append("inputValue", project.operationCode);
      }
    });

    const queryString = params.toString();

    return queryString ? `${baseHref}?${queryString}` : baseHref;
  };

  return (
    <main className="datastory-page project-sheet flex flex-col pb-64">
      <Datastory.Hero
        breadcrumbs={[
          ...hero.breadcrumbs,
          {
            url: `/datastories/portugal-2030/beneficiarios-do-portugal-2030/${id}`,
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

      <Section
        className="flex flex-col items-center gap-64 bg-neutral-100 py-64"
        id={distribution.id}
      >
        <InfoBlock.Root>
          <InfoBlock.Header className="flex flex-row gap-24">
            <InfoBlock.Title title={distribution.title} className="max-w-[592px] text-2xl-bold!" />
          </InfoBlock.Header>
        </InfoBlock.Root>

        <InfoBlock.Root>
          <InfoBlock.Content className="grid grid-cols-12 gap-x-32 gap-y-0 xl:grid-cols-12">
            <div className="col-span-12 xl:col-span-4">
              <BenProjSheet.CardLined
                title={formatValuesWithSuffix(beneficiaryData.approvedValue)}
                description={t("sheetBenProj.fields.valor_financiamento")}
              />
            </div>
            <div className="col-span-12 xl:col-span-8"></div>

            <div className="col-span-12 xl:relative xl:col-span-3">
              {hasOnlyOneTypeOfBen && (
                <div className="relative ml-1/2 h-128 w-0 border-b-0 border-l border-dashed border-neutral-500 xl:h-[124px] xl:w-[calc(50%+32px)] xl:border-b">
                  <RoundedIcon
                    className="roundedIcon absolute bottom-1/2 left-0 z-10 -translate-x-1/2 translate-y-1/2 rotate-90 xl:bottom-0 xl:rotate-0"
                    icon={{
                      name: "agora-line-arrow-right-anchor",
                      color: "white",
                      backgroundColor: "primary-600",
                    }}
                  />
                </div>
              )}
              {hasMainBen && hasOtherBen && (
                <>
                  <div className="relative ml-[50%] hidden h-[124px] w-[calc(50%+32px)] border-b border-dashed border-neutral-500 xl:block">
                    <RoundedIcon
                      className="roundedIcon absolute bottom-0 left-0 z-10 -translate-x-1/2 translate-y-1/2"
                      icon={{
                        name: "agora-line-arrow-right-anchor",
                        color: "white",
                        backgroundColor: "primary-600",
                      }}
                    />
                  </div>
                  <div className="absolute top-[124px] left-1/2 hidden h-full w-[calc(50%+32px)] border-b border-l border-dashed border-neutral-500 xl:block">
                    <RoundedIcon
                      className="roundedIcon absolute bottom-0 left-0 z-10 -translate-x-1/2 translate-y-1/2 rotate-90 xl:rotate-0"
                      icon={{
                        name: "agora-line-arrow-right-anchor",
                        color: "white",
                        backgroundColor: "primary-600",
                      }}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="col-span-12 flex flex-col gap-64 py-0 xl:col-span-9 xl:py-64">
              {hasMainBen && (
                <div className="grid grid-cols-9 items-center gap-16">
                  <div className="col-span-9 xl:col-span-5">
                    <BenProjSheet.CardIcon
                      icon={{
                        name: distribution.cards[1].icon ?? "",
                        color: "#007CF8",
                        backgroundColor: "bg-primary-200",
                      }}
                      title={"title" in distribution.cards[1] ? distribution.cards[1].title : ""}
                      description={distribution.cards[1].subtitle ?? ""}
                      className="bg-white"
                    >
                      <BenProjSheet.BigValue
                        value={formatValuesWithSuffix(mainBen?.approvedValue ?? 0)}
                        label={t("sheetBenProj.fields.valor_financiamento")}
                      />
                      <div className="flex w-full flex-col gap-32 xl:flex-row">
                        <BenProjSheet.MediumValue
                          value={formatValuesWithSuffix(mainBen?.executedValue ?? 0)}
                          label={t("sheetBenProj.fields.valor_executado")}
                        />
                        <BenProjSheet.MediumValue
                          value={formatValuesWithSuffix(mainBen?.paidValue ?? 0)}
                          label={t("sheetBenProj.fields.valor_pago")}
                        />
                      </div>
                    </BenProjSheet.CardIcon>
                  </div>
                  <div className="col-span-9 mr-1/2 h-64 border-r border-dashed border-neutral-500 xl:col-span-1 xl:mr-0 xl:h-0 xl:border-t" />
                  <div className="col-span-9 xl:col-span-3">
                    <BenProjSheet.CardGraph
                      description={
                        "description" in distribution.cards[1]
                          ? distribution.cards[1].description
                          : ""
                      }
                      graphValue={(mainBen?.percentageExecutedValue ?? 0) * 100}
                      className="items-center justify-center"
                      classNameDescription="text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            {hasOtherBen && (
              <>
                <div className="col-span-12 xl:col-span-3">
                  <div className="relative ml-1/2 block h-128 border-l border-dashed border-neutral-500 xl:hidden">
                    <RoundedIcon
                      className="roundedIcon absolute bottom-1/2 left-0 z-10 -translate-x-1/2 translate-y-1/2 xl:bottom-0"
                      icon={{
                        name: "agora-line-arrow-down-anchor",
                        color: "white",
                        backgroundColor: "primary-600",
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-12 flex flex-col gap-64 py-0 xl:col-span-9 xl:py-64">
                  <div className="grid grid-cols-9 items-center gap-16">
                    <div className="col-span-9 xl:col-span-5">
                      <BenProjSheet.CardIcon
                        icon={{
                          name: distribution.cards[2].icon ?? "",
                          color: "#007CF8",
                          backgroundColor: "bg-primary-200",
                        }}
                        title={"title" in distribution.cards[2] ? distribution.cards[2].title : ""}
                        description={distribution.cards[2].subtitle ?? ""}
                        className="bg-white"
                      >
                        <BenProjSheet.BigValue
                          value={formatValuesWithSuffix(otherBen?.approvedValue ?? 0)}
                          label={t("sheetBenProj.fields.valor_financiamento")}
                        />
                        <div className="flex w-full flex-col gap-32 xl:flex-row">
                          <BenProjSheet.MediumValue
                            value={formatValuesWithSuffix(otherBen?.executedValue ?? 0)}
                            label={t("sheetBenProj.fields.valor_executado")}
                          />
                          <BenProjSheet.MediumValue
                            value={formatValuesWithSuffix(otherBen?.paidValue ?? 0)}
                            label={t("sheetBenProj.fields.valor_pago")}
                          />
                        </div>
                      </BenProjSheet.CardIcon>
                    </div>
                    <div className="col-span-9 mr-1/2 h-64 border-r border-dashed border-neutral-500 xl:col-span-1 xl:mr-0 xl:h-0 xl:border-t" />
                    <div className="col-span-9 xl:col-span-3">
                      <BenProjSheet.CardGraph
                        description={
                          "description" in distribution.cards[1]
                            ? distribution.cards[1].description
                            : ""
                        }
                        graphValue={(otherBen?.percentageExecutedValue ?? 0) * 100}
                        className="items-center justify-center"
                        classNameDescription="text-center"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="col-span-12 pt-32 pb-64">
              <SourceInfoFooter
                dataSource={sourceInfo[0].source ?? ""}
                update={sourceInfo[0].modificationDate ?? ""}
                technicalSheet={benPt2030TechnicalSheet}
              />
            </div>
          </InfoBlock.Content>
        </InfoBlock.Root>
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
                        >
                          {"anchor" in projects.cards[1] ? projects.cards[1].anchor.children : ""}
                        </ButtonGeneral>
                      </Link>
                    </div>
                  </div>
                  <div className="order-2 col-span-12 xl:order-1 xl:col-span-7">
                    <div className="flex flex-col gap-32">
                      <ProjectsByEntityList
                        data={dataMainBen.queryProjectsByBeneficiarySheetOfPortugal2030.data ?? []}
                        total={dataMainBen.queryProjectsByBeneficiarySheetOfPortugal2030.total}
                        nif={id}
                        entityRole={"BENEFICIARIO_PRINCIPAL"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {otherBenProjectjsQuantity > 0 && (
              <div className="flex flex-col gap-32">
                <Typograph tag="h3" className="text-l-bold text-neutral-900">
                  {"title" in projects.cards[2] ? projects.cards[2].title : ""}
                </Typograph>
                <div className="grid grid-cols-12 gap-32">
                  <div className="order-1 col-span-12 grid grid-cols-5 xl:order-2 xl:col-span-5">
                    <div className="col-span-12 flex flex-col gap-32 xl:col-span-3 xl:col-start-2">
                      <BenProjSheet.CardLined
                        title={otherBenProjectjsQuantity.toString()}
                        description={t("projects")}
                        className="items-center border-t-4 border-l-0"
                      />
                      <Link href={projects.cards[3].anchor.href ?? "#"}>
                        <ButtonGeneral
                          fullWidth
                          hasIcon
                          trailingIcon={projects.cards[3].anchor.icon ?? ""}
                          trailingIconHover={projects.cards[3].anchor.icon ?? ""}
                          appearance="link"
                        >
                          {"anchor" in projects.cards[3] ? projects.cards[3].anchor.children : ""}
                        </ButtonGeneral>
                      </Link>
                    </div>
                  </div>
                  <div className="order-2 col-span-12 xl:order-1 xl:col-span-7">
                    <div className="flex flex-col gap-32">
                      <ProjectsByEntityList
                        data={dataOtherBen.queryProjectsByBeneficiarySheetOfPortugal2030.data ?? []}
                        total={dataOtherBen.queryProjectsByBeneficiarySheetOfPortugal2030.total}
                        nif={id}
                        entityRole={"OUTROS_BENEFICIARIOS"}
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
