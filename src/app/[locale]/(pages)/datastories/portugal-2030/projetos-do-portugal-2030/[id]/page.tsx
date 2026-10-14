import initTranslations from "@/app/i18n";
import { BenProjSheet } from "@/components/datastories/BeneficiaryAndProject/Sheet";
import { BenProjSheetTab } from "@/components/datastories/BeneficiaryAndProject/Tabs";
import ProjectTabs from "@/components/datastories/BeneficiaryAndProject/Tabs/ProjectTabs";
import { Datastory } from "@/components/Shared/Datastories";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import {
  getPT2030ProjectData,
  getPT2030ProjectMeta,
  queryLoadMoreBeneficiariesInProjectSheetOfPortugal2030,
} from "@/service/queries/datastories/datastory";
import {
  Project,
  PT2030Project,
  PT2030ProjectSheetBeneficiaryResponse,
} from "@/service/types/datastories/pt2030/pt2030";
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
    findFichaDeProjetoSingleton: { data: unknown };
  }>({
    query: getPT2030ProjectMeta(locale),
  });

  if (error || !data) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const { hero } = flattenData(
    data.findFichaDeProjetoSingleton.data as Record<string, unknown>
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
    findFichaDeProjetoSingleton: { data: unknown };
    queryProjectSheetOfPortugal2030: PT2030Project;
  }>({
    query: getPT2030ProjectData(locale),
    variables: {
      codigoProjeto: decodedId,
    },
  });

  if (error || !data) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const { hero, projectSheet, beneficiaries, applications, geographicDistribution } = flattenData(
    data?.findFichaDeProjetoSingleton.data as Record<string, unknown>
  ) as Project;

  const projectData = flattenData(
    data?.queryProjectSheetOfPortugal2030 as Record<string, unknown>
  ) as PT2030Project;

  const { data: dataMainBen, error: errorMainBen } = await apolloClient.query<{
    queryBeneficiariesByProjectSheetOfPortugal2030: PT2030ProjectSheetBeneficiaryResponse;
  }>({
    query: queryLoadMoreBeneficiariesInProjectSheetOfPortugal2030,
    variables: { projectCode: decodedId, beneficiaryType: "MAIN", limit: 4, page: 1 },
  });

  if (errorMainBen || !dataMainBen) {
    console.error("Error:", errorMainBen);
    throw new Error(errorMainBen?.message ?? "Failed to fetch data");
  }

  const { data: dataOtherBen, error: errorOtherBen } = await apolloClient.query<{
    queryBeneficiariesByProjectSheetOfPortugal2030: PT2030ProjectSheetBeneficiaryResponse;
  }>({
    query: queryLoadMoreBeneficiariesInProjectSheetOfPortugal2030,
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

  return (
    <main className="datastory-page project-sheet flex flex-col gap-128 pb-128">
      <Datastory.Hero
        breadcrumbs={[
          ...hero.breadcrumbs,
          {
            url: `/datastories/portugal-2030/projetos-do-portugal-2030/${id}`,
            label: projectSheet.id,
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
                title={t("sheetBenProj.fields.objetivo_estrategico")}
                value={projectData.objetivo_estrategico}
              />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.objetivo_especifico")}
                value={projectData.objetivo_especifico}
              />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.modalidade")}
                value={projectData.modalidade}
              />
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
                      main: dataMainBen.queryBeneficiariesByProjectSheetOfPortugal2030.data ?? [],
                      more: dataOtherBen.queryBeneficiariesByProjectSheetOfPortugal2030.data ?? [],
                    }}
                  />
                ),
              },
              {
                id: applications.id,
                title: applications.title,
                body: (
                  <BenProjSheetTab.Application
                    title={applications.title}
                    description={applications.description}
                    application={applications.cards}
                    applicationData={projectData.candidaturas}
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
                  ></BenProjSheetTab.GeographicDistribution>
                ),
              },
            ]}
          />
        </InfoBlock.Content>
      </Section>
    </main>
  );
}
