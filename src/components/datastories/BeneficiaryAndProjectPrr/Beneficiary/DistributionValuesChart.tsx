import RoundedIcon from "@/components/Primitives/RoundedIcon";
import { LinkIcon } from "@/components/Primitives/LinkIcon";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import { SourceInfoFooter } from "@/components/Shared/SourceInfoFooter";
import { Fragment } from "react";
import { Beneficiary, PRRBeneficiaryProjectGroup, PRRBeneficiaryRelatedProjects, PRRBeneficiaryValueByEntityRole } from "@/service/types/datastories/prr/prr";
import { BenProjSheet } from "../../BeneficiaryAndProject/Sheet";
import { TechnicalSheetModalData } from "@/service/types/modal/technical-sheet";

const roleCardIndex = {
  intermediate: 1,
  beneficiary: 2,
  supplier: 3,
} as const;

type DistributionValuesChartProps = {
  distribution: Beneficiary["distribution"];
  approvedValue: number;
  relatedProjects: PRRBeneficiaryRelatedProjects;
  valuesByEntityRole?: PRRBeneficiaryValueByEntityRole[] | null;
  formatValuesWithSuffix: (value: number | string) => string;
  labels: {
    financedValue: string;
    receivedValue: string;
    suppliersValues: string;
    totalFunded: string;
    suppliersInDetail: string;
    suppliers: string;
    fundedValue: string;
    seeMoreSuppliers: string;
  };
  sourceInfo?: {
    dataSource: string;
    update: string;
    technicalSheet?: TechnicalSheetModalData;
  };
};

type DisplayRole = "intermediate" | "beneficiary" | "supplier";
type RoleRow = { role: DisplayRole; group: PRRBeneficiaryProjectGroup };
type RoleValues = {
  approvedValue: number;
  executedValue: number;
  percentageExecutedValue: number;
};

function getCard(cards: unknown[], index: number) {
  return (cards[index] ?? null) as Record<string, unknown> | null;
}

const normalizeRole = (role: string): DisplayRole | "partner" | null => {
  const normalized = role
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("intermedi")) return "intermediate";
  if (normalized.includes("fornecedor") || normalized.includes("supplier")) {
    return "supplier";
  }
  if (normalized.includes("parceir") || normalized.includes("partner")) {
    return "partner";
  }
  if (
    normalized.includes("beneficiario") ||
    normalized.includes("beneficiary") ||
    normalized.includes("direto") ||
    normalized.includes("final")
  ) {
    return "beneficiary";
  }

  return null;
};

export default function DistributionValuesChart({
  distribution,
  approvedValue,
  relatedProjects,
  valuesByEntityRole,
  formatValuesWithSuffix,
  labels,
  sourceInfo,
}: DistributionValuesChartProps) {
  const valuesByRole = (valuesByEntityRole ?? []).reduce<
    Record<DisplayRole, RoleValues>
  >(
    (acc, item) => {
      const role = normalizeRole(item.entityRole);
      if (!role || role === "partner") return acc;

      const current = acc[role];
      const approved = Number(item.approvedValue ?? 0);
      const executed = Number(item.executedValue ?? 0);
      const nextApproved = current.approvedValue + approved;
      const nextExecuted = current.executedValue + executed;
      const rawPct = Number(item.percentageExecutedValue ?? 0);
      const pctFromRaw = rawPct <= 1 ? rawPct * 100 : rawPct;
      const nextPct =
        nextApproved > 0
          ? (nextExecuted / nextApproved) * 100
          : current.percentageExecutedValue + pctFromRaw;

      acc[role] = {
        approvedValue: nextApproved,
        executedValue: nextExecuted,
        percentageExecutedValue: nextPct,
      };

      return acc;
    },
    {
      intermediate: {
        approvedValue: 0,
        executedValue: 0,
        percentageExecutedValue: 0,
      },
      beneficiary: {
        approvedValue: 0,
        executedValue: 0,
        percentageExecutedValue: 0,
      },
      supplier: {
        approvedValue: 0,
        executedValue: 0,
        percentageExecutedValue: 0,
      },
    },
  );

  const roleRows: RoleRow[] = ([
    {
      role: "intermediate",
      group: relatedProjects.intermediaryBeneficiaryProjects,
    },
    {
      role: "beneficiary",
      group: relatedProjects.beneficiaryProjects,
    },
    {
      role: "supplier",
      group: relatedProjects.supplierProjects,
    },
  ] as RoleRow[]).filter(
    ({ role }) => Number(valuesByRole[role].approvedValue ?? 0) > 0,
  );

  const renderDistributionBlock = (roleData: {
    role: DisplayRole;
    group: PRRBeneficiaryProjectGroup;
  }) => {
    const card = getCard(distribution.cards, roleCardIndex[roleData.role]);
    const iconName = (card?.iconName as string) || "agora-line-star";
    const title = (card?.title as string) || "";
    const description = (card?.imageAlt as string) || "";
    const graphDescription = (card?.description as string) || "";
    const roleValues = valuesByRole[roleData.role];
    const approvedValueByRole = roleValues.approvedValue;
    const paidValueByRole = roleValues.executedValue;
    const percentageExecutedValue = roleValues.percentageExecutedValue;
    const supplierItems = (roleData.group.list ?? []).map((project) => ({
      area: project.name,
      value: Number(project.amount ?? 0),
    }));
    const visibleSuppliers = supplierItems.slice(0, 5);
    const totalSuppliers = Number(roleData.group.total ?? 0);
    const hasMoreSuppliers = totalSuppliers > visibleSuppliers.length;

    return (
      <div className="col-span-12 md:col-span-9 flex flex-col gap-64 pb-64">
        <div className="grid grid-cols-9 gap-16 items-center">
          <div className="col-span-9 md:col-span-5">
            <BenProjSheet.CardIcon
              icon={{
                name: iconName,
                color: "#007CF8",
                backgroundColor: "bg-fundo-europeu-50",
              }}
              title={title}
              description={description}
              className="bg-white max-w-[488px] w-full"
            >
              <BenProjSheet.BigValue
                value={formatValuesWithSuffix(approvedValueByRole)}
                label={labels.financedValue}
              />
              {roleData.role !== "supplier" && (
                <div className="w-full flex flex-col md:flex-row gap-32">
                  <BenProjSheet.MediumValue
                    value={formatValuesWithSuffix(paidValueByRole)}
                    label={labels.receivedValue}
                  />
                </div>
              )}
            </BenProjSheet.CardIcon>
          </div>
          <div className="col-span-9 md:col-span-1 border-dashed border-neutral-500 border-r mr-1/2 md:mr-0 md:border-t h-64 md:h-0" />
          <div className="col-span-9 md:col-span-3">
            <BenProjSheet.CardGraph
              description={graphDescription}
              graphValue={percentageExecutedValue}
              className="items-center justify-center"
              classNameDescription="text-center"
            />
          </div>
        </div>

        {roleData.role === "supplier" && supplierItems.length > 0 && (
          <div className="flex flex-col gap-24">
            <BenProjSheet.AreaValuelist
              areaTitle={labels.suppliersValues}
              items={[
                {
                  area: labels.totalFunded,
                  value: approvedValueByRole,
                },
              ]}
            />

            <BenProjSheet.AreaValuelist
              areaTitle={labels.suppliersInDetail}
              areaSubtitle={`${totalSuppliers} ${labels.suppliers}`}
              header={{
                area: labels.suppliers,
                value: labels.fundedValue,
              }}
              items={visibleSuppliers}
            />

            {hasMoreSuppliers && (
              <div className="w-full flex justify-center">
                <LinkIcon
                  title={labels.seeMoreSuppliers}
                  href="#"
                  icon={{
                    name: "agora-line-plus-circle",
                    hoverName: "agora-solid-plus-circle",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDistributionRow = (
    roleData: RoleRow,
    rowIndex: number,
    totalRows: number,
  ) => {
    const hasNextRow = rowIndex < totalRows - 1;
    const connectorTop = "top-[60px]";

    return (
      <div key={`distribution-${roleData.role}`} className="contents">
        <div className="col-span-12 md:col-span-3 relative">
          <div
            className={`hidden md:block absolute left-1/2 top-0 border-l border-dashed border-neutral-500 ${
              hasNextRow ? "bottom-0" : "h-[60px]"
            }`}
          />
          <div
            className={`hidden md:block absolute left-1/2 ${connectorTop} w-[calc(50%+32px)] border-t border-dashed border-neutral-500`}
          />
          <RoundedIcon
            className={`hidden md:flex roundedIcon z-10 absolute left-1/2 ${connectorTop} -translate-x-1/2 -translate-y-1/2`}
            icon={{
              name: "agora-line-arrow-right-anchor",
              color: "white",
              backgroundColor: "fundo-europeu-500",
            }}
          />
          <div className="md:hidden h-64 ml-1/2 border-l border-dashed border-neutral-500 relative">
            <RoundedIcon
              className="roundedIcon z-10 absolute left-0 bottom-1/2 -translate-x-1/2 translate-y-1/2"
              icon={{
                name: "agora-line-arrow-down-anchor",
                color: "white",
                backgroundColor: "fundo-europeu-500",
              }}
            />
          </div>
        </div>
        {renderDistributionBlock(roleData)}
      </div>
    );
  };

  return (
    <InfoBlock.Root>
      <InfoBlock.Content className="grid grid-cols-12! gap-y-0 gap-x-32">
        <div className="col-span-12 md:col-span-3">
            <BenProjSheet.CardLined
              title={formatValuesWithSuffix(approvedValue)}
              description={labels.financedValue}
              className="w-sm"
            />
        </div>
        <div className="col-span-12 md:col-span-9" />

        <div className="contents">
          <div className="col-span-12 md:col-span-3">
            <div className="hidden md:block h-64 ml-1/2 border-l border-dashed border-neutral-500" />
          </div>
          <div className="hidden md:block col-span-12 md:col-span-9 h-64" />
        </div>

        {roleRows.map((roleData, index) => (
          <Fragment key={`distribution-wrap-${roleData.role}`}>
            {renderDistributionRow(roleData, index, roleRows.length)}
            {index < roleRows.length - 1 && (
              <div className="contents">
                <div className="col-span-12 md:col-span-3">
                  <div className="hidden md:block h-64 ml-1/2 border-l border-dashed border-neutral-500" />
                </div>
                <div className="hidden md:block col-span-12 md:col-span-9 h-64" />
              </div>
            )}
          </Fragment>
        ))}

        {sourceInfo && (sourceInfo.dataSource || sourceInfo.update) && (
          <div className="pt-32 pb-64 col-span-12">
            <SourceInfoFooter
              dataSource={sourceInfo.dataSource}
              update={sourceInfo.update}
              technicalSheet={sourceInfo.technicalSheet}
            />
          </div>
        )}
      </InfoBlock.Content>
    </InfoBlock.Root>
  );
}
