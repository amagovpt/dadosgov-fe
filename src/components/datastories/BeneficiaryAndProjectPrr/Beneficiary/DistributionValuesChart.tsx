import RoundedIcon from "@/components/Primitives/RoundedIcon";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import { SourceInfoFooter } from "@/components/Shared/SourceInfoFooter";
import { Fragment } from "react";
import {
  Beneficiary,
  PRRBeneficiaryProjectGroup,
  PRRBeneficiaryRelatedProjects,
  PRRBeneficiaryRelatedProjectsType,
  PRRBeneficiaryValueByEntityRole,
} from "@/service/types/datastories/prr/prr";
import { BenProjSheet } from "../../BeneficiaryAndProject/Sheet";
import { TechnicalSheetModalData } from "@/service/types/modal/technical-sheet";
import DistributionTable from "./DistributionTable";

const roleCardIndex = {
  intermediate: 1,
  beneficiary: 2,
  supplier: 3,
} as const;

const roleApiType: Record<DisplayRole, PRRBeneficiaryRelatedProjectsType> = {
  intermediate: "INTERMEDIARY",
  beneficiary: "BENEFICIARY",
  supplier: "SUPPLIER",
};

type DistributionValuesChartProps = {
  nif: string;
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
    paidValue: string;
    beneficiary: string;
    supplier: string;
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
  nif,
  distribution,
  approvedValue,
  relatedProjects,
  valuesByEntityRole,
  formatValuesWithSuffix,
  labels,
  sourceInfo,
}: DistributionValuesChartProps) {
  const valuesByRole = (valuesByEntityRole ?? []).reduce<Record<DisplayRole, RoleValues>>(
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
    }
  );

  const roleRows: RoleRow[] = (
    [
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
    ] as RoleRow[]
  ).filter(({ role }) => Number(valuesByRole[role].approvedValue ?? 0) > 0);

  // The table lists the entities one level below the role: an intermediate funds beneficiaries,
  // a beneficiary pays suppliers, and the supplier block lists the suppliers themselves.
  const nameColumnLabel: Record<DisplayRole, string> = {
    intermediate: labels.beneficiary,
    beneficiary: labels.supplier,
    supplier: labels.supplier,
  };

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
    const totalSuppliers = Number(roleData.group.total ?? 0);

    return (
      <div className="col-span-12 flex flex-col gap-64 pb-64 md:col-span-9">
        <div className="grid grid-cols-9 items-center gap-16">
          <div className="col-span-9 md:col-span-5">
            <BenProjSheet.CardIcon
              icon={{
                name: iconName,
                color: "#034AD8",
                backgroundColor: "bg-primary-100",
              }}
              title={title}
              description={description}
              className="w-full max-w-[488px] bg-white"
            >
              <BenProjSheet.BigValue
                value={formatValuesWithSuffix(approvedValueByRole)}
                label={labels.financedValue}
              />
              {roleData.role !== "supplier" && (
                <div className="flex w-full flex-col gap-32 md:flex-row">
                  <BenProjSheet.MediumValue
                    value={formatValuesWithSuffix(paidValueByRole)}
                    label={labels.receivedValue}
                  />
                </div>
              )}
            </BenProjSheet.CardIcon>
          </div>
          <div className="col-span-9 mr-1/2 h-64 border-r border-dashed border-neutral-500 md:col-span-1 md:mr-0 md:h-0 md:border-t" />
          <div className="col-span-9 md:col-span-3">
            <BenProjSheet.CardGraph
              description={graphDescription}
              graphValue={percentageExecutedValue}
              className="items-center justify-center"
              classNameDescription="text-center"
            />
          </div>
        </div>

        <div className="flex flex-col gap-24 xl:max-w-3/4">
          <BenProjSheet.AreaValuelist
            areaTitle={labels.suppliersValues}
            items={[
              {
                area: labels.totalFunded,
                value: approvedValueByRole,
              },
            ]}
          />

          <div className="flex flex-col gap-32">
            <div className="flex flex-col gap-8">
              <Typograph tag="p" className="text-l-bold text-neutral-900">
                {labels.suppliersInDetail}
              </Typograph>
              <Typograph tag="p" className="text-s-regular text-neutral-900">
                {`${totalSuppliers} ${labels.suppliers}`}
              </Typograph>
            </div>

              <DistributionTable
                nif={nif}
                type={roleApiType[roleData.role]}
                group={roleData.group}
                labels={{
                  name: nameColumnLabel[roleData.role],
                  fundedValue: labels.fundedValue,
                  paidValue: labels.paidValue,
                  seeMore: labels.suppliers.toLowerCase(),
                }}
              />
          </div>
        </div>
      </div>
    );
  };

  const renderDistributionRow = (roleData: RoleRow, rowIndex: number, totalRows: number) => {
    const hasNextRow = rowIndex < totalRows - 1;
    const connectorTop = "top-[60px]";

    return (
      <div key={`distribution-${roleData.role}`} className="contents">
        <div className="relative col-span-12 md:col-span-3">
          <div
            className={`absolute top-0 left-1/2 hidden border-l border-dashed border-neutral-500 md:block ${
              hasNextRow ? "bottom-0" : "h-[60px]"
            }`}
          />
          <div
            className={`absolute left-1/2 hidden md:block ${connectorTop} w-[calc(50%+32px)] border-t border-dashed border-neutral-500`}
          />
          <RoundedIcon
            className={`roundedIcon absolute left-1/2 z-10 hidden md:flex ${connectorTop} -translate-x-1/2 -translate-y-1/2`}
            icon={{
              name: "agora-line-arrow-right-anchor",
              color: "white",
              backgroundColor: "primary-600",
            }}
          />
          <div className="relative ml-1/2 h-64 border-l border-dashed border-neutral-500 md:hidden">
            <RoundedIcon
              className="roundedIcon absolute bottom-1/2 left-0 z-10 -translate-x-1/2 translate-y-1/2"
              icon={{
                name: "agora-line-arrow-down-anchor",
                color: "white",
                backgroundColor: "primary-600",
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
      <InfoBlock.Content className="grid grid-cols-12! gap-x-32 gap-y-0">
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
            <div className="ml-1/2 hidden h-64 border-l border-dashed border-neutral-500 md:block" />
          </div>
          <div className="col-span-12 hidden h-64 md:col-span-9 md:block" />
        </div>

        {roleRows.map((roleData, index) => (
          <Fragment key={`distribution-wrap-${roleData.role}`}>
            {renderDistributionRow(roleData, index, roleRows.length)}
            {index < roleRows.length - 1 && (
              <div className="contents">
                <div className="col-span-12 md:col-span-3">
                  <div className="ml-1/2 hidden h-64 border-l border-dashed border-neutral-500 md:block" />
                </div>
                <div className="col-span-12 hidden h-64 md:col-span-9 md:block" />
              </div>
            )}
          </Fragment>
        ))}

        {sourceInfo && (sourceInfo.dataSource || sourceInfo.update) && (
          <div className="col-span-12 pt-32 pb-64">
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
