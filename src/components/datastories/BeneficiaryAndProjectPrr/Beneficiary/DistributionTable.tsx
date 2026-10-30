"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatCompactEUR } from "@/utils/formatCurrency";
import {
  PRRBeneficiaryProjectGroup,
  PRRBeneficiaryProjectItem,
  PRRBeneficiaryRelatedProjectsType,
} from "@/service/types/datastories/prr/prr";
import { BenProjSheet } from "../../BeneficiaryAndProject/Sheet";
import { TableColumn } from "../../BeneficiaryAndProject/Sheet/Table";
import { loadMoreRelatedProjects } from "./loadMoreRelatedProjects";

type DistributionTableProps = {
  nif: string;
  type: PRRBeneficiaryRelatedProjectsType;
  group: PRRBeneficiaryProjectGroup;
  labels: {
    name: string;
    fundedValue: string;
    paidValue: string;
    seeMore: string;
  };
};

export default function DistributionTable({ nif, type, group, labels }: DistributionTableProps) {
  const { t } = useTranslation();
  const [totalItems, setTotalItems] = useState<number>(Number(group.total ?? 0));

  const formatValuesWithSuffix = (value: number | string) => {
    const [finValue, finSuffix] = formatCompactEUR(Number(value));
    return `${finValue} ${t(finSuffix)} €`;
  };

  const handleLoadMore = useCallback(
    async (page: number) => {
      const resObj = await loadMoreRelatedProjects(nif, type, page, t);
      setTotalItems(Number(resObj.total ?? 0));
      return { data: resObj.data ?? [] };
    },
    [nif, type, t]
  );

  const columns: TableColumn<PRRBeneficiaryProjectItem>[] = [
    { label: labels.name, render: (item) => item.name },
    {
      label: labels.fundedValue,
      align: "right",
      highlight: true,
      width: "20%",
      render: (item) => formatValuesWithSuffix(item.amount ?? 0),
    },
    {
      label: labels.paidValue,
      align: "right",
      highlight: true,
      width: "20%",
      render: (item) => formatValuesWithSuffix(item.paid ?? 0),
    },
  ];

  return (
    <BenProjSheet.Table<PRRBeneficiaryProjectItem>
      columns={columns}
      initialItems={group.list ?? []}
      totalItems={totalItems}
      onLoadMore={handleLoadMore}
      getRowKey={(item, index) => `${type}-${item.id}-${index}`}
      seeMoreText={labels.seeMore}
    />
  );
}
