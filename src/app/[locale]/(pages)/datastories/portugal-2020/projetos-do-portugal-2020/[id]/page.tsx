import initTranslations from "@/app/i18n";
import { BenProjSheet } from "@/components/datastories/BeneficiaryAndProject/Sheet";
import { BenProjSheetTab } from "@/components/datastories/BeneficiaryAndProject/Tabs";
import ProjectTabs from "@/components/datastories/BeneficiaryAndProject/Tabs/ProjectTabs";
import { Datastory } from "@/components/Shared/Datastories";
import Sources from "@/components/Shared/Datastories/Sections/Sources";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import { SourceInfoFooter } from "@/components/Shared/SourceInfoFooter";
import {
  getPT2020ProjectData,
  getPT2020ProjectMeta,
  queryLoadMoreBeneficiariesInProjectSheetOfPortugal2020,
} from "@/service/queries/datastories/datastories-pt2020";
import { getTechnicalSheetData } from "@/service/queries/modal/technical-sheet";
import {
  Project,
  PT2020Project,
  PT2020ProjectSheetBeneficiaryResponse,
} from "@/service/types/datastories/pt2020/pt2020";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { formatCurrency } from "@/utils/formatCurrency";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const { data, error } = await apolloClient.query<{
    findFichaDeProjetoPt2020Singleton: { data: unknown };
  }>({
    query: getPT2020ProjectMeta(locale),
  });

  if (error || !data) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const { hero } = flattenData(
    data.findFichaDeProjetoPt2020Singleton.data as Record<string, unknown>
  ) as Project;

  return {
    title: hero.title,
    description: hero.description,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["common"],
  });

  const decodedId = decodeURIComponent(id);

  const { data, error } = await apolloClient.query<{
    findFichaDeProjetoPt2020Singleton: { data: unknown };
    queryProjectSheetOfPortugal2020: PT2020Project;
  }>({
    query: getPT2020ProjectData(locale),
    variables: {
      codigoProjeto: decodedId,
    },
  });

  if (error || !data) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const { hero, projectSheet, beneficiaries, geographicDistribution, datasets } = flattenData(
    data?.findFichaDeProjetoPt2020Singleton.data as Record<string, unknown>
  ) as Project;

  const projectData = flattenData(
    data?.queryProjectSheetOfPortugal2020 as Record<string, unknown>
  ) as PT2020Project;

  const { data: dataMainBen, error: errorMainBen } = await apolloClient.query<{
    queryBeneficiariesByProjectSheetOfPortugal2020: PT2020ProjectSheetBeneficiaryResponse;
  }>({
    query: queryLoadMoreBeneficiariesInProjectSheetOfPortugal2020,
    variables: { projectCode: decodedId, beneficiaryType: "MAIN", limit: 4, page: 1 },
  });

  if (errorMainBen || !dataMainBen) {
    console.error("Error:", errorMainBen);
    throw new Error(errorMainBen?.message ?? "Failed to fetch data");
  }

  const { data: dataOtherBen, error: errorOtherBen } = await apolloClient.query<{
    queryBeneficiariesByProjectSheetOfPortugal2020: PT2020ProjectSheetBeneficiaryResponse;
  }>({
    query: queryLoadMoreBeneficiariesInProjectSheetOfPortugal2020,
    variables: {
      projectCode: decodedId,
      beneficiaryType: "OTHER",
      limit: 4,
      page: 1,
    },
  });

  if (errorOtherBen || !dataOtherBen) {
    console.error("Error:", errorOtherBen);
    throw new Error(errorOtherBen?.message ?? "Failed to fetch data");
  }

  const pubAdminWorkersBySubsectorTechnicalSheet = await getTechnicalSheetData(
    "pt2020-ficha-de-projeto",
    locale
  );

  return (
    <main className="datastory-page project-sheet flex flex-col gap-64 pb-64">
      <Datastory.Hero
        breadcrumbs={[
          ...hero.breadcrumbs,
          {
            url: `/datastories/portugal-2020/projetos-do-portugal-2020/${id}`,
            label: decodedId,
          },
        ]}
        pretitle={hero.title}
        title={projectData.nome}
        index={hero.index}
        className="[&_.info-datastory]:justify-center"
      />

      <Section className="flex flex-col items-center gap-32" id={projectSheet.id}>
        <InfoBlock.Root>
          <InfoBlock.Header>
            <InfoBlock.Title title={projectSheet.title} className="max-w-[592px] text-2xl-bold!" />
          </InfoBlock.Header>
        </InfoBlock.Root>

        <BenProjSheet.Root classNameList="grid grid-cols-12">
          <BenProjSheet.List className="col-span-12 xl:col-span-6">
            <BenProjSheet.Wrapper className="border-t-neutral-200">
              <BenProjSheet.Item title={t("sheetBenProj.fields.nome")} value={projectData.nome} />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.codigo_projeto")}
                value={projectData.codigo_projeto}
                tooltipText={t("sheetBenProj.tooltips.codigo_projeto")}
              />
            </BenProjSheet.Wrapper>
          </BenProjSheet.List>
          <BenProjSheet.List className="col-span-12 xl:col-span-6">
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.valor_financiamento")}
                value={formatCurrency(Number(projectData.valor_financiamento ?? 0), t)}
                className="border-b-2 border-b-neutral-200 xl:w-auto xl:grow xl:border-none"
              />

              <BenProjSheet.Item
                title={t("sheetBenProj.fields.valor_executado")}
                value={formatCurrency(Number(projectData.valor_executado ?? 0), t)}
                className="border-b-2 border-b-neutral-200 xl:w-auto xl:grow xl:border-none"
              />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              {projectData.dt_conclusao_efetiva ? (
                <BenProjSheet.Item
                  title={t("sheetBenProj.fields.dt_inicio_prevista")}
                  value={projectData.dt_conclusao_efetiva}
                  className="border-b-2 border-b-neutral-200 xl:w-auto xl:grow xl:border-none"
                />
              ) : (
                <>
                  <BenProjSheet.Item
                    title={t("sheetBenProj.fields.dt_inicio_prevista")}
                    value={projectData.dt_inicio_prevista ?? ""}
                    className="border-b-2 border-b-neutral-200 xl:w-auto xl:grow xl:border-none"
                  />
                  <BenProjSheet.Item
                    title={t("sheetBenProj.fields.dt_conclusao_prevista")}
                    value={projectData.dt_conclusao_prevista ?? ""}
                    className="border-b-2 border-b-neutral-200 xl:w-auto xl:grow xl:border-none"
                  />
                </>
              )}
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.sumario")}
                value={projectData.sumario}
                isSummary
              />
            </BenProjSheet.Wrapper>
          </BenProjSheet.List>
        </BenProjSheet.Root>
      </Section>

      <Section className="flex flex-col items-center">
        <InfoBlock.Content className="flex flex-col">
          <ProjectTabs
            tabs={[
              {
                id: beneficiaries.id,
                title: beneficiaries.title,
                body: (
                  <BenProjSheetTab.Beneficiaries
                    title={beneficiaries.title}
                    beneficiaries={beneficiaries.cards}
                    beneficiariesData={{
                      main: dataMainBen.queryBeneficiariesByProjectSheetOfPortugal2020.data ?? [],
                      more: dataOtherBen.queryBeneficiariesByProjectSheetOfPortugal2020.data ?? [],
                    }}
                  />
                ),
              },
              {
                id: geographicDistribution.id,
                title: geographicDistribution.title,
                body: (
                  <BenProjSheetTab.GeographicDistribution
                    title={geographicDistribution.title}
                    geographicDistribution={geographicDistribution.cards}
                    geographicDistributionData={projectData.distribuicao_geografica}
                  >
                    <SourceInfoFooter
                      dataSource={projectData.info_datasets[0].source ?? ""}
                      update={projectData.info_datasets[0].reference_date ?? ""}
                      technicalSheet={pubAdminWorkersBySubsectorTechnicalSheet}
                    />
                  </BenProjSheetTab.GeographicDistribution>
                ),
              },
            ]}
          />
        </InfoBlock.Content>
      </Section>

      {datasets && datasets.active !== false && <Sources {...datasets} className="p-0" />}
    </main>
  );
}
