"use client";

import ButtonGeneral from "@/components/Primitives/Button";
import { LinkIcon } from "@/components/Primitives/LinkIcon";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatCompactEUR } from "@/utils/formatCurrency";
import {
  Beneficiary,
  PRRBeneficiaryProjectGroup,
  PRRBeneficiaryProjectItem,
  PRRBeneficiaryRelatedProjects,
  PRRBeneficiaryRelatedProjectsType,
} from "@/service/types/datastories/prr/prr";
import { LoadMoreWrapper } from "@/components/Shared/Wrappers/LoadMoreWrapper";
import { BenProjSheet } from "../../BeneficiaryAndProject/Sheet";
import Link from "next/link";
import { loadMoreRelatedProjects } from "./loadMoreRelatedProjects";

const roleProjectCardIndex = {
  intermediate: { title: 0, cta: 1 },
  beneficiary: { title: 2, cta: 3 },
  partner: { title: 4, cta: 5 },
  supplier: { title: 6, cta: 7 },
} as const;

type DisplayRole = keyof typeof roleProjectCardIndex;
const roleApiType: Record<DisplayRole, PRRBeneficiaryRelatedProjectsType> = {
  intermediate: "INTERMEDIARY",
  beneficiary: "BENEFICIARY",
  partner: "PARTNER",
  supplier: "SUPPLIER",
};

function getCard(cards: unknown[], index: number) {
  return (cards[index] ?? null) as Record<string, unknown> | null;
}

type RelatedProjectsContentProps = {
  projectsSection: Beneficiary["projects"];
  relatedProjects: PRRBeneficiaryRelatedProjects;
  labels: {
    projects: string;
    conclusionDate: string;
    receivedFinancing: string;
    receivedValue: string;
    seeMoreProjects: string;
    /** "Projetos em que participa enquanto <role>", one per role */
    titleByRole: Record<DisplayRole, string>;
  };
  nif: string;
};

type ProjectsByRoleListProps = {
  role: DisplayRole;
  group: PRRBeneficiaryProjectGroup;
  labels: RelatedProjectsContentProps["labels"];
  nif: string;
};

function ProjectsByRoleList({ role, group, labels, nif }: ProjectsByRoleListProps) {
  const { i18n, t } = useTranslation();
  const [totalItems, setTotalItems] = useState<number | undefined>(Number(group.total ?? 0));

  const formatValuesWithSuffix = (value: number | string) => {
    const [finValue, finSuffix] = formatCompactEUR(Number(value));
    return `${finValue} ${t(finSuffix)} €`;
  };

  const handleLoadMore = useCallback(
    async (page: number) => {
      const resObj = await loadMoreRelatedProjects(nif, roleApiType[role], page, t);
      setTotalItems(Number(resObj.total ?? 0));
      return { data: resObj.data ?? [] };
    },
    [nif, role, t]
  );

  return (
    <LoadMoreWrapper<PRRBeneficiaryProjectItem>
      initialItems={group.list ?? []}
      totalItems={totalItems}
      onLoadMore={handleLoadMore}
      seeMoreText={labels.projects.toLowerCase()}
      className="load-more-list flex flex-col gap-32"
      renderItem={(project, index) => {
        const href = `/${i18n.language}/datastories/prr/projetos-do-prr/${encodeURIComponent(project.id)}`;

        return (
          <div
            key={`project-${role}-${project.id}-${index}`}
            className="relative w-full gap-16 rounded-4 bg-white p-32"
          >
            <div className="flex flex-col gap-8">
              <Typograph tag="h2" className="text-l-bold text-neutral-900">
                {project.name}
              </Typograph>

              {project.date && (
                <Typograph tag="p" className="text-m-regular text-neutral-900">
                  <span className="text-m-semibold">{labels.conclusionDate}</span>
                  <span className="ml-8">{project.date}</span>
                </Typograph>
              )}
            </div>

            {role !== "partner" && (
              <div className="mt-32 flex flex-col">
                <Typograph tag="p" className="text-m-regular text-neutral-900">
                  <span className="text-m-semibold">{labels.receivedFinancing}</span>
                  <span className="ml-8">{formatValuesWithSuffix(project.amount)}</span>
                </Typograph>
                <Typograph tag="p" className="text-m-regular text-neutral-900">
                  <span className="text-m-semibold">{labels.receivedValue}</span>
                  <span className="ml-8">{formatValuesWithSuffix(project.paid)}</span>
                </Typograph>
              </div>
            )}

            <div className="right-28 absolute top-1/2 -translate-y-1/2 xl:right-32">
              <LinkIcon
                title=""
                href={href}
                className="p-0! leading-none!"
                icon={{
                  name: "agora-line-arrow-right-circle",
                  hoverName: "agora-solid-arrow-right-circle",
                }}
              />
            </div>
          </div>
        );
      }}
    />
  );
}

export default function RelatedProjectsContent({
  projectsSection,
  relatedProjects,
  labels,
  nif,
}: RelatedProjectsContentProps) {
  const relatedProjectRows: Array<{
    role: DisplayRole;
    group: PRRBeneficiaryProjectGroup;
  }> = [
    { role: "intermediate", group: relatedProjects.intermediaryBeneficiaryProjects },
    { role: "beneficiary", group: relatedProjects.beneficiaryProjects },
    { role: "partner", group: relatedProjects.partnerProjects },
    { role: "supplier", group: relatedProjects.supplierProjects },
  ];

  const orderedRelatedProjects = relatedProjectRows.filter(
    ({ group }) => Number(group?.total ?? 0) > 0
  );

  return (
    <div className="flex flex-col gap-64">
      {orderedRelatedProjects.map(({ role, group }) => {
        const cardIdx = roleProjectCardIndex[role];
        const ctaCard = getCard(projectsSection.cards, cardIdx.cta);

        return (
          <div key={`related-${role}`} className="flex flex-col gap-32">
            <Typograph tag="h3" className="text-l-bold text-neutral-900">
              {labels.titleByRole[role]}
            </Typograph>
            <div className="grid grid-cols-12 gap-32">
              <div className="order-1 col-span-12 grid grid-cols-5 gap-32 xl:order-2 xl:col-span-5">
                <div className="col-span-12 flex flex-col gap-32 xl:col-span-3 xl:col-start-2">
                  <BenProjSheet.CardLined
                    title={String(group.total ?? 0)}
                    description={labels.projects}
                    className="border-t-fundo-europeu-500 items-center border-t-4 border-l-0"
                  />
                  <Link href={(ctaCard?.anchor as Record<string, string>)?.href ?? "#"}>
                    <ButtonGeneral
                      fullWidth
                      hasIcon
                      trailingIcon={(ctaCard?.anchor as Record<string, string>)?.icon ?? ""}
                      trailingIconHover={
                        (ctaCard?.anchor as Record<string, string>)?.icon ?? ""
                      }
                      appearance="link"
                      variant="neutral"
                    >
                      {(ctaCard?.anchor as Record<string, string>)?.children ?? ""}
                    </ButtonGeneral>
                  </Link>
                </div>
              </div>
              <div className="order-2 col-span-12 xl:order-1 xl:col-span-7">
                <ProjectsByRoleList role={role} group={group} labels={labels} nif={nif} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
