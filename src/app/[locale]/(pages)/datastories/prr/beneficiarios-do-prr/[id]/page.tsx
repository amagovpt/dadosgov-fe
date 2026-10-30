import initTranslations from "@/app/i18n";
import BeneficiarySheetContent from "@/components/datastories/BeneficiaryAndProjectPrr/Beneficiary/BeneficiarySheetContent";
import DistributionValuesChart from "@/components/datastories/BeneficiaryAndProjectPrr/Beneficiary/DistributionValuesChart";
import RelatedProjectsContent from "@/components/datastories/BeneficiaryAndProjectPrr/Beneficiary/RelatedProjectsContent";
import { Datastory } from "@/components/Shared/Datastories";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import { PRR_BENEFICIARY_PROJECTS_LIMIT } from "@/components/datastories/BeneficiaryAndProjectPrr/Beneficiary/loadMoreRelatedProjects";
import {
  getPrrBeneficiaryData,
  getPrrBeneficiaryMeta,
  getPrrBeneficiarySheet,
  getPrrBeneficiarySourceInfo,
  queryLoadMorePrrProjectsByBeneficiary,
} from "@/service/queries/datastories/datastory";
import { getTechnicalSheetData } from "@/service/queries/modal/technical-sheet";
import {
  Beneficiary,
  PRRBeneficiaryProjectGroup,
  PRRBeneficiaryRelatedProjects,
  PRRBeneficiaryRelatedProjectsResponse,
  PRRBeneficiaryRelatedProjectsType,
  PRRBeneficiarySheetResponse,
  PRRBeneficiarySheetSourceInfoResponse,
} from "@/service/types/datastories/prr/prr";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { formatCompactEUR } from "@/utils/formatCurrency";
import { Metadata } from "next";
import { headers } from "next/headers";
import Sources from "@/components/Shared/Datastories/Sections/Sources";

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
    findFichaDeBeneficiarioPrrSingleton: { data: unknown };
  }>({
    query: getPrrBeneficiaryMeta(locale),
  });

  if (!data || error) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const { hero } = flattenData(
    data.findFichaDeBeneficiarioPrrSingleton.data as Record<string, unknown>
  ) as Beneficiary;

  return {
    title: `${hero?.title}`,
    description: hero?.description,
    openGraph: {
      images: [`${siteUrl}/images/og-images/social_media.jpg`],
    },
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

  const relatedProjectsQuery = (type: PRRBeneficiaryRelatedProjectsType) =>
    apolloClient.query<{
      queryBeneficiaryRelatedProjectsOfPRR: PRRBeneficiaryRelatedProjectsResponse;
    }>({
      query: queryLoadMorePrrProjectsByBeneficiary(type),
      variables: { nif: id, page: 1, limit: PRR_BENEFICIARY_PROJECTS_LIMIT },
      fetchPolicy: "no-cache",
    });

  const [
    pageResult,
    sheetResult,
    sourceInfoResult,
    beneficiaryProjectsResult,
    intermediaryProjectsResult,
    partnerProjectsResult,
    supplierProjectsResult,
    beneficiaryTechnicalSheet,
  ] = await Promise.all([
    apolloClient.query<{
      findFichaDeBeneficiarioPrrSingleton: { data: unknown };
    }>({
      query: getPrrBeneficiaryData(locale),
    }),
    apolloClient.query<{
      queryBeneficiarySheetOfPRR: PRRBeneficiarySheetResponse;
    }>({
      query: getPrrBeneficiarySheet(),
      variables: { nif: id },
      fetchPolicy: "no-cache",
    }),
    apolloClient.query<{
      queryBeneficiarySheetSourceInfoOfPRR: PRRBeneficiarySheetSourceInfoResponse;
    }>({
      query: getPrrBeneficiarySourceInfo(),
    }),
    relatedProjectsQuery("BENEFICIARY"),
    relatedProjectsQuery("INTERMEDIARY"),
    relatedProjectsQuery("PARTNER"),
    relatedProjectsQuery("SUPPLIER"),
    getTechnicalSheetData("prr-ficha-de-beneficiario", locale),
  ]);

  if (pageResult.error || !pageResult.data) {
    console.error("Error:", pageResult.error);
    throw new Error(pageResult.error?.message ?? "Failed to fetch data");
  }

  if (sheetResult.error || !sheetResult.data) {
    console.error("Error:", sheetResult.error);
    throw new Error(sheetResult.error?.message ?? "Failed to fetch data");
  }

  const { hero, beneficiarySheet, distribution, projects, datasets } = flattenData(
    pageResult.data.findFichaDeBeneficiarioPrrSingleton.data as Record<string, unknown>
  ) as Beneficiary;

  const beneficiarySheetData = sheetResult.data.queryBeneficiarySheetOfPRR?.data;
  const beneficiaryForm = beneficiarySheetData?.beneficiaryForm;

  if (!beneficiarySheetData || !beneficiaryForm) {
    throw new Error("Failed to fetch beneficiary sheet data");
  }

  // A failed group renders as empty instead of breaking the whole sheet.
  const toProjectGroup = (
    result: Awaited<ReturnType<typeof relatedProjectsQuery>>
  ): PRRBeneficiaryProjectGroup => {
    if (result.error) console.error("Error:", result.error);
    const response = result.data?.queryBeneficiaryRelatedProjectsOfPRR;
    return { total: Number(response?.total ?? 0), list: response?.data ?? [] };
  };

  const beneficiaryRelatedProjects: PRRBeneficiaryRelatedProjects = {
    beneficiaryProjects: toProjectGroup(beneficiaryProjectsResult),
    intermediaryBeneficiaryProjects: toProjectGroup(intermediaryProjectsResult),
    partnerProjects: toProjectGroup(partnerProjectsResult),
    supplierProjects: toProjectGroup(supplierProjectsResult),
  };

  const beneficiarySheetViewData = {
    ...beneficiaryForm,
    budget: beneficiarySheetData.budget,
    valuesByEntityRole: beneficiarySheetData.valuesByEntityRole,
  };

  if (sourceInfoResult.error) console.error("Error:", sourceInfoResult.error);
  const sourceInfo = sourceInfoResult.data?.queryBeneficiarySheetSourceInfoOfPRR?.sourceInfo ?? [];
  const mainSourceInfo = sourceInfo[0];
  const beneficiarySourceInfo = {
    dataSource: mainSourceInfo?.source ?? "",
    update: mainSourceInfo?.modificationDate ?? "",
    technicalSheet: beneficiaryTechnicalSheet,
  };

  const formatValuesWithSuffix = (value: number | string) => {
    const [finValue, finSuffix] = formatCompactEUR(Number(value));
    return `${finValue} ${t(finSuffix)} \u20AC`;
  };

  const suppliersLabel = t("searchBenProj.suppliers");
  const projectsLabel = t("projects");

  const beneficiarySheetLabels = {
    name: t("sheetBenProj.fields.ben_name"),
    financedValue: t("sheetBenProj.fields.valor_financiamento"),
    totalProjects: t("sheetBenProj.fields.total_projetos"),
    taxId: t("sheetBenProj.fields.nif"),
    economicActivity: t("sheetBenProj.fields.atividade_economica"),
    headquartersLocation: t("sheetBenProj.fields.localizacao_sede"),
    financedValueTooltip: t("sheetBenProj.tooltips.valor_financiamento_beneficiario"),
  };

  const distributionLabels = {
    financedValue: t("sheetBenProj.fields.valor_financiamento"),
    receivedValue: t("sheetBenProj.fields.valor_recebido"),
    totalFunded: t("sheetBenProj.fields.total_financiado"),
    suppliers: suppliersLabel,
    fundedValue: t("financingValue"),
    paidValue: t("paidValue"),
    byRole: {
      intermediate: {
        areaTitle: t("sheetBenProj.beneficiariesValues"),
        tableTitle: t("sheetBenProj.beneficiariesInDetail"),
        nameColumn: t("searchBenProj.roles.beneficiary"),
        countLabel: t("beneficiaries"),
      },
      beneficiary: {
        areaTitle: t("sheetBenProj.suppliersValues"),
        tableTitle: t("sheetBenProj.suppliersInDetail"),
        nameColumn: suppliersLabel,
        countLabel: suppliersLabel,
      },
      supplier: {
        areaTitle: t("sheetBenProj.consortiumMembersValues"),
        tableTitle: t("sheetBenProj.suppliersInDetail"),
        nameColumn: suppliersLabel,
        countLabel: suppliersLabel,
      },
    },
    seeMoreSuppliers: t("seeMore", { about: suppliersLabel.toLowerCase() }),
  };

  const relatedProjectsLabels = {
    projects: projectsLabel,
    conclusionDate: t("conclusionDate"),
    receivedFinancing: t("sheetBenProj.fields.financiamento_recebido"),
    receivedValue: t("sheetBenProj.fields.valor_recebido"),
    seeMoreProjects: t("seeMore", { about: projectsLabel.toLowerCase() }),
    titleByRole: Object.fromEntries(
      (
        [
          ["intermediate", "searchBenProj.roles.intermediateBeneficiary"],
          ["beneficiary", "searchBenProj.roles.beneficiary"],
          ["partner", "searchBenProj.roles.partner"],
          ["supplier", "searchBenProj.roles.supplier"],
        ] as const
      ).map(([role, roleKey]) => [
        role,
        t("sheetBenProj.projectsByRoleTitle", { role: t(roleKey).toLowerCase() }),
      ])
    ) as Record<"intermediate" | "beneficiary" | "partner" | "supplier", string>,
  };

  return (
    <main className="datastory-page flex flex-col pb-128">
      <Datastory.Hero
        breadcrumbs={[
          ...hero.breadcrumbs,
          {
            url: `/datastories/prr/beneficiarios-do-prr/${id}`,
            label: beneficiarySheetViewData.nif,
          },
        ]}
        pretitle={hero.title}
        title={beneficiarySheetViewData.name}
        index={hero.index}
        className="[&_.info-datastory]:justify-center"
      />

      <Section className="flex flex-col items-center gap-32 py-128" id={beneficiarySheet.id}>
        <InfoBlock.Root>
          <InfoBlock.Header className="flex flex-row gap-24">
            <InfoBlock.Title
              title={beneficiarySheet.title}
              className="text-2xl-bold! text-neutral-900!"
            />
          </InfoBlock.Header>
        </InfoBlock.Root>

        <BeneficiarySheetContent
          beneficiaryData={beneficiarySheetViewData}
          formatValuesWithSuffix={formatValuesWithSuffix}
          labels={beneficiarySheetLabels}
        />
      </Section>

      <Section
        className="flex flex-col items-center gap-64 bg-primary-100 pt-128"
        id={distribution.id}
      >
        <InfoBlock.Root>
          <InfoBlock.Header className="flex flex-row gap-24">
            <InfoBlock.Title
              title={distribution.title}
              className="text-2xl-bold! text-neutral-900!"
            />
          </InfoBlock.Header>
        </InfoBlock.Root>

        <DistributionValuesChart
          nif={id}
          distribution={distribution}
          approvedValue={Number(beneficiarySheetViewData.budget ?? 0)}
          relatedProjects={beneficiaryRelatedProjects}
          valuesByEntityRole={beneficiarySheetViewData.valuesByEntityRole}
          formatValuesWithSuffix={formatValuesWithSuffix}
          labels={distributionLabels}
          sourceInfo={beneficiarySourceInfo}
        />
      </Section>

      <Section
        className="flex flex-col items-center gap-64 pt-64 pb-128"
        id={projects.id}
      >
        <InfoBlock.Root>
          <InfoBlock.Header className="flex flex-row gap-24">
            <InfoBlock.Title title={projects.title} className="text-2xl-bold! text-neutral-900!" />
          </InfoBlock.Header>
        </InfoBlock.Root>

        <InfoBlock.Root>
          <InfoBlock.Content className="flex flex-col gap-64">
            <RelatedProjectsContent
              projectsSection={projects}
              relatedProjects={beneficiaryRelatedProjects}
              labels={relatedProjectsLabels}
              nif={id}
            />
          </InfoBlock.Content>
        </InfoBlock.Root>
      </Section>

      {datasets && datasets.active !== false && <Sources {...datasets} className="p-0" />}
    </main>
  );
}
