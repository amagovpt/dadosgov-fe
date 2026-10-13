import initTranslations from "@/app/i18n";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import { SourceInfoFooter } from "@/components/Shared/SourceInfoFooter";
import { Project } from "@/service/types/datastories/pt2030/pt2030";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { formatCurrency } from "@/utils/formatCurrency";
import { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const host = (await headers()).get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const siteUrl = `${protocol}://${host}`;

  const { data, error } = await apolloClient.query<{
    findFichaDeProjetoSingleton: { data: unknown };
  }>({
    query: getProjectMeta(locale),
  });

  if (!data || error) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const { hero } = flattenData(
    data?.findFichaDeProjetoSingleton.data as Record<string, unknown>
  ) as Project;

  return {
    title: `${hero?.title}`,
    description: hero?.subtitle,
    openGraph: {
      images: [`${siteUrl}/images/og-images/social_media.jpg`],
    },
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
    query: getProjectData(locale),
    variables: {
      codigoProjeto: decodedId,
    },
  });

  if (error || !data) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const {
    hero,
    projectSheet,
    beneficiaries,
    applications,
    geographicDistribution,
  } = flattenData(data?.findFichaDeProjetoSingleton.data as Record<string, unknown>) as Project;

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

  const projPt2030OpenDataModal = await getPublicDataModal("pt2030-ficha-de-projeto", locale);

  const pubAdminWorkersBySubsectorTechnicalSheet = await getTechnicalSheetModal(
    "pt2030-ficha-de-projeto",
    locale
  );

  return (
    <main className="project-sheet flex flex-col gap-128 pb-128">
      <HeroGeneral.Root>
        <HeroGeneral.BenProjContent
          title={hero.title}
          titleLevel={"h1"}
          lastBreadcrumb={t("sheetBenProj.project.pt2030")}
          subjectName={projectData.nome}
        />
        <HeroGeneral.SiteMap cardTitle={hero.sitemap?.title} inThisPage={hero.sitemap?.links} />
      </HeroGeneral.Root>

      <Section className="flex flex-col items-center gap-32" id={projectSheet.id}>
        <InfoBlock.Root>
          <InfoBlock.Header className="flex flex-row gap-24">
            <InfoBlock.Icon icon={projectSheet.iconName} />
            <InfoBlock.Title title={projectSheet.title} />
          </InfoBlock.Header>
        </InfoBlock.Root>

        <BenProjSheet.Root classNameList="grid grid-cols-12">
          <BenProjSheet.List className="col-span-12 xl:col-span-5">
            <BenProjSheet.Wrapper className="border-t-2 border-t-neutral-200">
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
          <BenProjSheet.List className="col-span-12 xl:col-span-7">
            <BenProjSheet.Wrapper className="xl:border-t-2 xl:border-t-neutral-200">
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.valor_financiamento")}
                value={formatCurrency(Number(projectData.valor_financiamento ?? 0), t)}
                className="border-b-2 border-b-neutral-200 xl:w-auto xl:grow xl:border-none"
              />{" "}
              <BenProjSheet.Wrapper className="border-none xl:w-[432px]">
                <BenProjSheet.Item
                  title={t("sheetBenProj.fields.valor_executado")}
                  value={formatCurrency(Number(projectData.valor_executado ?? 0), t)}
                  className="border-b-2 border-b-neutral-200 xl:border-none"
                />
                <BenProjSheet.Item
                  title={t("sheetBenProj.fields.valor_pago")}
                  value={formatCurrency(Number(projectData.valor_pago ?? 0), t)}
                />
              </BenProjSheet.Wrapper>
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.dt_inicio_prevista")}
                value={projectData.dt_inicio_prevista ?? ""}
                className="border-b-2 border-b-neutral-200 xl:w-auto xl:grow xl:border-none"
              />
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.dt_conclusao_prevista")}
                value={projectData.dt_conclusao_prevista ?? ""}
                className="xl:w-[432px]"
              />
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
              /*
              {
                id: publicContracting.id,
                title: publicContracting.title,
                body: (
                  <BenProjSheetTab.PublicContracting
                    title={publicContracting.title}
                    publicContracting={publicContracting.cards}
                  />
                ),
              },
              */
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
                      download={{
                        id: { technicalSheet: "download" },
                        header: {
                          iconName: projPt2030OpenDataModal.header?.iconName ?? "",
                          title: projPt2030OpenDataModal.header?.title ?? "",
                          subtitle: projPt2030OpenDataModal.header?.subtitle ?? "",
                        },
                        cardDownload: projectData.info_datasets.map((source) => ({
                          fileName: source.info[0].title,
                          fileUrl: source.info[0].url,
                          fileType: source.info[0].format,
                          lastUpdated: source.info[0].modification_date ?? "",
                        })),
                      }}
                      technicalSheet={pubAdminWorkersBySubsectorTechnicalSheet}
                    />
                  </BenProjSheetTab.GeographicDistribution>
                ),
              },
            ]}
          />
        </InfoBlock.Content>
      </Section>
    </main>
  );
}
