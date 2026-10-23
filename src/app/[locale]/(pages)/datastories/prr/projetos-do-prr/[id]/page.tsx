import initTranslations from "@/app/i18n";
import { BenProjSheet } from "@/components/datastories/BeneficiaryAndProject/Sheet";
import { BenProjSheetTabPRR } from "@/components/datastories/BeneficiaryAndProjectPrr/Sheet/Tabs";
import ProjectTabsHashSync from "@/components/datastories/BeneficiaryAndProjectPrr/Sheet/Tabs/ProjectTabsHashSync";
import { Datastory } from "@/components/Shared/Datastories";
import Sources from "@/components/Shared/Datastories/Sections/Sources";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import { SourceInfoFooter } from "@/components/Shared/SourceInfoFooter";
import { Tabs } from "@/components/Shared/Tabs";
import {
  getPrrProjectData,
  getPrrProjectMeta,
  getPrrProjectSheet,
  loadMorePrrProjectSheetBeneficiaryFinancing,
} from "@/service/queries/datastories/datastory";
import { getTechnicalSheetData } from "@/service/queries/modal/technical-sheet";
import {
  Project,
  ProjectSheetBeneficiaryFinancingGroup,
  ProjectSheetBeneficiaryFinancingResponse,
  ProjectSheetBeneficiaryFinancingType,
  ProjectSheetOfPRRData,
  ProjectViewData,
} from "@/service/types/datastories/prr/prr";
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
    findFichaDeProjetoPrrSingleton: { data: unknown };
  }>({
    query: getPrrProjectMeta(locale),
  });

  if (!data || error) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const { hero } = flattenData(
    data.findFichaDeProjetoPrrSingleton.data as Record<string, unknown>
  ) as Project;

  return {
    title: `${hero?.title}`,
    description: hero?.description,
    openGraph: {
      images: [`${siteUrl}/images/og-images/social_media.jpg`],
    },
  };
}

type TerritorialType = "concelho" | "distrito" | "subregiao" | "regiao";

const TERRITORIAL_ORDER: Record<TerritorialType, number> = {
  concelho: 1,
  distrito: 2,
  subregiao: 3,
  regiao: 4,
};

function toNumber(value: number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
}

function toTerritorialType(value: string | null | undefined): TerritorialType | null {
  if (!value) return null;

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (
    normalized === "concelho" ||
    normalized === "distrito" ||
    normalized === "subregiao" ||
    normalized === "regiao"
  ) {
    return normalized;
  }

  return null;
}

function formatFinalScore(value: string | null | undefined, locale: string): string {
  if (!value) return "";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;

  return parsed.toLocaleString(locale.startsWith("pt") ? "pt-PT" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function mapBeneficiaryFinancingGroup(
  group: ProjectSheetBeneficiaryFinancingResponse | null | undefined,
  beneficiaryType: ProjectSheetBeneficiaryFinancingType
): ProjectSheetBeneficiaryFinancingGroup {
  return {
    beneficiaryType,
    items: (group?.data ?? []).map((item) => ({
      nif_entidade: item.id ?? "",
      nome: item.name ?? "",
      valor_financiamento: toNumber(item.description),
      valor_pago: toNumber(item.paid),
    })),
    limit: group?.limit ?? 0,
    page: group?.page ?? 1,
    total: group?.total ?? 0,
    totalFiltered: group?.totalFiltered ?? 0,
  };
}

function mapProjectSheetToViewData(
  project: ProjectSheetOfPRRData,
  beneficiaryFinancing: {
    intermediate: ProjectSheetBeneficiaryFinancingGroup;
    beneficiaries: ProjectSheetBeneficiaryFinancingGroup;
    partners: ProjectSheetBeneficiaryFinancingGroup;
    suppliers: ProjectSheetBeneficiaryFinancingGroup;
  },
  locale: string
): ProjectViewData {
  const totalProjectValue = toNumber(project.projectForm?.totalProjectValue);
  const geoTab = project.tabs?.geoDistributionFinancing;

  const territorialDistributions = (geoTab?.distribution ?? [])
    .map((area) => {
      const tipo = toTerritorialType(area.type);
      if (!tipo) return null;

      return {
        tipo,
        order: TERRITORIAL_ORDER[tipo],
        distribuicao: (area.divisions ?? []).map((division) => ({
          descricao: division.description ?? "",
          valor_financiamento: toNumber(division.value),
        })),
      };
    })
    .filter((area): area is NonNullable<typeof area> => area !== null);

  return {
    codigoProjeto: project.code ?? "",
    nome: project.projectForm?.name ?? "",
    valorTotalProjeto: totalProjectValue,
    valorPago: toNumber(project.projectForm?.executedValue),
    financiamentoNaoReembolsavel: toNumber(project.projectForm?.grantFunding),
    financiamentoEmprestimos: toNumber(project.projectForm?.loanFunding),
    dataInicio: project.projectForm?.startDate ?? "",
    dataConclusao: project.projectForm?.plannedConclusionDate ?? "",
    dimensao: project.projectForm?.dimension ?? "",
    componente: project.projectForm?.component ?? "",
    investimento: project.projectForm?.investment ?? "",
    codigoOperacao: project.code ?? "",
    sumario: project.projectForm?.summary ?? "",
    applicationTab: {
      codigoAviso: "",
      criteriosSelecao: project.tabs?.contestAndContracts?.criteria?.join("<br />") ?? "",
      notaFinal: formatFinalScore(project.tabs?.candidature?.finalScore, locale),
      designacaoAviso: "",
      link: project.tabs?.candidature?.link ?? "",
      baseScore: project.tabs?.candidature?.baseScore ?? "",
    },
    beneficiaryData: beneficiaryFinancing,
    geographicDistributionData: [
      {
        tipo: "transversal",
        pc_valor_executado: toNumber(geoTab?.valuePercentage),
        distribuicao_indefinida: null,
        valor_financiamento_total: String(totalProjectValue),
      },
      ...territorialDistributions,
    ],
    geographicDistributionSourceInfo: {
      source: geoTab?.source ?? null,
      sourceLink: geoTab?.sourceLink ?? null,
      referenceDate: geoTab?.referenceDate ?? null,
    },
    publicContractingData: project.tabs?.contracts ?? null,
    contestAndContractsData: project.tabs?.contestAndContracts ?? null,
  };
}

function formatDateToDot(value: string) {
  const [year = "", month = "", day = ""] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}.${month}.${year}`;
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const projectCode = decodeURIComponent(id);
  const { t } = await initTranslations({
    locale,
    namespaces: ["common"],
  });

  const [pageDataResult, projectSheetResult] = await Promise.all([
    apolloClient.query<{
      findFichaDeProjetoPrrSingleton: { data: unknown };
    }>({
      query: getPrrProjectData(locale),
    }),
    apolloClient.query<{
      queryProjectSheetOfPRR: { data: ProjectSheetOfPRRData | null };
    }>({
      query: getPrrProjectSheet(),
      variables: {
        recipientId: projectCode,
      },
    }),
  ]);

  if (pageDataResult.error || !pageDataResult.data) {
    console.error("Error:", pageDataResult.error);
    throw new Error(pageDataResult.error?.message ?? "Failed to fetch data");
  }

  if (projectSheetResult.error || !projectSheetResult.data) {
    console.error("Error:", projectSheetResult.error);
    throw new Error(projectSheetResult.error?.message ?? "Failed to fetch data");
  }

  const projectSheetData = projectSheetResult.data.queryProjectSheetOfPRR?.data;
  if (!projectSheetData) {
    throw new Error("Project sheet not found");
  }

  const beneficiaryTypes: ProjectSheetBeneficiaryFinancingType[] = [
    "INTERMEDIARY_BENEFICIARY",
    "BENEFICIARY",
    "PARTNER",
    "SUPPLIER",
  ];

  const initialLimits: Record<ProjectSheetBeneficiaryFinancingType, number> = {
    INTERMEDIARY_BENEFICIARY: 4,
    BENEFICIARY: 4,
    PARTNER: 4,
    SUPPLIER: 4,
  };

  const beneficiaryFinancingResults = await Promise.all(
    beneficiaryTypes.map((beneficiaryType) =>
      apolloClient.query<{
        queryProjectSheetBeneficiaryFinancingOfPRR: ProjectSheetBeneficiaryFinancingResponse;
      }>({
        query: loadMorePrrProjectSheetBeneficiaryFinancing(beneficiaryType),
        variables: {
          page: 1,
          limit: initialLimits[beneficiaryType],
          projectCode: projectSheetData.code,
        },
      })
    )
  );

  const beneficiaryFinancingData = {
    intermediate: mapBeneficiaryFinancingGroup(
      beneficiaryFinancingResults[0]?.data?.queryProjectSheetBeneficiaryFinancingOfPRR,
      "INTERMEDIARY_BENEFICIARY"
    ),
    beneficiaries: mapBeneficiaryFinancingGroup(
      beneficiaryFinancingResults[1]?.data?.queryProjectSheetBeneficiaryFinancingOfPRR,
      "BENEFICIARY"
    ),
    partners: mapBeneficiaryFinancingGroup(
      beneficiaryFinancingResults[2]?.data?.queryProjectSheetBeneficiaryFinancingOfPRR,
      "PARTNER"
    ),
    suppliers: mapBeneficiaryFinancingGroup(
      beneficiaryFinancingResults[3]?.data?.queryProjectSheetBeneficiaryFinancingOfPRR,
      "SUPPLIER"
    ),
  };

  const prrProjectTechnicalSheet = await getTechnicalSheetData("prr-ficha-de-projeto", locale);

  const {
    hero,
    projectSheet,
    beneficiaries,
    applications,
    publicContracting,
    geographicDistribution,
    datasets,
  } = flattenData(
    pageDataResult.data.findFichaDeProjetoPrrSingleton.data as Record<string, unknown>
  ) as Project;

  const viewData = mapProjectSheetToViewData(projectSheetData, beneficiaryFinancingData, locale);

  const valorTotalProjeto = formatCurrency(viewData.valorTotalProjeto, t);

  const valorPago = formatCurrency(viewData.valorPago, t);

  const financiamentoNaoReembolsavel = formatCurrency(viewData.financiamentoNaoReembolsavel, t);

  const financiamentoEmprestimos = formatCurrency(viewData.financiamentoEmprestimos, t);

  return (
    <main className="flex flex-col gap-64 pb-128">
      <Datastory.Hero
        breadcrumbs={[
          ...hero.breadcrumbs,
          {
            url: `/datastories/portugal-2030/projetos-do-portugal-2030/${id}`,
            label: projectCode,
          },
        ]}
        pretitle={hero.title}
        title={viewData.nome}
        index={hero.index}
        className="[&_.info-datastory]:justify-center"
      />

      <Section className="flex flex-col items-center gap-32" id={projectSheet.id}>
        <InfoBlock.Root>
          <InfoBlock.Header className="flex flex-row gap-24">
            <InfoBlock.Title
              title={projectSheet.title}
              className="text-2xl-bold! text-neutral-900!"
            />
          </InfoBlock.Header>
        </InfoBlock.Root>

        <BenProjSheet.Root>
          <BenProjSheet.List>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item title={t("sheetBenProj.fields.nome")} value={viewData.nome} />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("prr.sheet.nonRepayableFunding")}
                value={financiamentoNaoReembolsavel}
              />
              <BenProjSheet.Item
                title={t("prr.sheet.loanFunding")}
                value={financiamentoEmprestimos}
              />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item title={t("prr.sheet.dimension")} value={viewData.dimensao} />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item title={t("prr.sheet.component")} value={viewData.componente} />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item title={t("prr.sheet.investment")} value={viewData.investimento} />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.codigo_projeto")}
                value={viewData.codigoOperacao}
                tooltipText={t("sheetBenProj.tooltips.codigo_projeto")}
              />
            </BenProjSheet.Wrapper>
          </BenProjSheet.List>

          <BenProjSheet.List>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("prr.sheet.totalProjectValue")}
                value={valorTotalProjeto}
                className="border-b-2 border-b-neutral-200 xl:border-none"
              />
              <BenProjSheet.Item title={t("sheetBenProj.fields.valor_pago")} value={valorPago} />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("prr.sheet.startDate")}
                value={formatDateToDot(viewData.dataInicio)}
                className="border-b-2 border-b-neutral-200 xl:border-none"
              />
              <BenProjSheet.Item
                title={t("prr.sheet.conclusionDate")}
                value={formatDateToDot(viewData.dataConclusao)}
              />
            </BenProjSheet.Wrapper>
            <BenProjSheet.Wrapper>
              <BenProjSheet.Item
                title={t("sheetBenProj.fields.sumario")}
                value={viewData.sumario}
                isSummary
              />
            </BenProjSheet.Wrapper>
          </BenProjSheet.List>
        </BenProjSheet.Root>
      </Section>

      <Section className="flex flex-col items-center">
        <InfoBlock.Content className="flex flex-col">
          <ProjectTabsHashSync>
            <Tabs.Section data-tab-id={beneficiaries.id}>
              <Tabs.Header>{beneficiaries.title}</Tabs.Header>
              <Tabs.Body>
                <BenProjSheetTabPRR.Beneficiaries
                  title={beneficiaries.title}
                  projectId={projectCode}
                  projectCode={viewData.codigoOperacao}
                  beneficiaries={beneficiaries.cards}
                  beneficiaryData={viewData.beneficiaryData}
                />
              </Tabs.Body>
            </Tabs.Section>

            <Tabs.Section data-tab-id={applications.id}>
              <Tabs.Header>{applications.title}</Tabs.Header>
              <Tabs.Body>
                <BenProjSheetTabPRR.Application
                  title={applications.subtitle}
                  description={applications.description}
                  application={applications.cards}
                  applicationData={viewData.applicationTab}
                />
              </Tabs.Body>
            </Tabs.Section>

            <Tabs.Section data-tab-id={publicContracting.id}>
              <Tabs.Header>{publicContracting.title}</Tabs.Header>
              <Tabs.Body>
                <BenProjSheetTabPRR.PublicContracting
                  title={publicContracting.title}
                  description={publicContracting.description}
                  publicContractingData={viewData.publicContractingData}
                  contestAndContractsData={viewData.contestAndContractsData}
                />
              </Tabs.Body>
            </Tabs.Section>

            <Tabs.Section data-tab-id={geographicDistribution.id}>
              <Tabs.Header>{geographicDistribution.title}</Tabs.Header>
              <Tabs.Body>
                <BenProjSheetTabPRR.GeographicDistribution
                  title={geographicDistribution.title}
                  geographicDistribution={geographicDistribution.cards}
                  geographicDistributionData={viewData.geographicDistributionData}
                >
                  <SourceInfoFooter
                    dataSource={
                      viewData.geographicDistributionSourceInfo.sourceLink ? (
                        <a
                          href={viewData.geographicDistributionSourceInfo.sourceLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {viewData.geographicDistributionSourceInfo.source}
                        </a>
                      ) : (
                        (viewData.geographicDistributionSourceInfo.source ?? "")
                      )
                    }
                    update={viewData.geographicDistributionSourceInfo.referenceDate ?? ""}
                    technicalSheet={prrProjectTechnicalSheet}
                  />
                </BenProjSheetTabPRR.GeographicDistribution>
              </Tabs.Body>
            </Tabs.Section>
          </ProjectTabsHashSync>
        </InfoBlock.Content>
      </Section>

      {datasets && datasets.active !== false && <Sources {...datasets} className="p-0" />}
    </main>
  );
}
