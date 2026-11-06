"use client";

import { formatCompactEUR } from "@/utils/formatCurrency";
import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import { Card } from "@/service/types/shared/common";
import {
  DistributionItem,
  GeographicDistribution,
  TerritorialDistribution,
  TransversalDistribution,
} from "@/service/types/datastories/prr/prr";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { BenProjSheet } from "@/components/datastories/BeneficiaryAndProject/Sheet";
import RoundedIcon from "@/components/Primitives/RoundedIcon";

export interface IBenProjSheetTabGeographicDistribution {
  title: string;
  geographicDistribution: Card[];
  geographicDistributionData: GeographicDistribution[];
  children?: ReactNode;
}

interface IListItem {
  item: DistributionItem;
}

function ListItem({ item }: IListItem) {
  const { t } = useTranslation();

  const [exeValue, exeSuffix] = formatCompactEUR(Number(item.valor_financiamento));
  const valor_financiamento = `${exeValue} ${t(exeSuffix)} €`;

  return (
    <li>
      <div className="flex w-full flex-row gap-32 border-b border-b-neutral-500 px-32 pb-8">
        <div className="grow text-neutral-900">{item.descricao}</div>
        <div className="text-m-bold text-primary-900">{valor_financiamento}</div>
      </div>
    </li>
  );
}

interface IList {
  area: string;
  items: DistributionItem[];
}

function List({ area, items }: IList) {
  const { t } = useTranslation();
  const [itemsShown, setItemsShown] = useState(5);

  const total = useMemo(() => items.length, [items]);
  const list = useMemo(() => items.slice(0, itemsShown), [items, itemsShown]);

  const handleSeeMore = () => {
    setItemsShown((prev) => Math.min(prev + 5, total));
  };

  return (
    <div className="flex flex-col gap-16">
      <ul className="flex w-full flex-col gap-8">
        {list.map((item, index) => {
          return <ListItem key={`list-${area}-${index}`} item={item} />;
        })}
      </ul>
      {itemsShown < total && (
        <Button
          appearance="link"
          hasIcon
          trailingIcon="agora-line-plus-circle"
          trailingIconHover="agora-solid-plus-circle"
          onClick={handleSeeMore}
        >
          {t("seeMore", { about: area })}
        </Button>
      )}
    </div>
  );
}

export default function BenProjSheetTabGeographicDistribution({
  title,
  geographicDistribution,
  geographicDistributionData,
  children,
}: IBenProjSheetTabGeographicDistribution) {
  const { t } = useTranslation();

  const areasData: TerritorialDistribution[] = useMemo(() => {
    return geographicDistributionData.filter((geoArea) => geoArea.tipo !== "transversal");
  }, [geographicDistributionData]);

  const sortedAreasData = useMemo(() => {
    return areasData.sort((a, b) => a.order - b.order);
  }, [areasData]);

  const countryData: TransversalDistribution[] = useMemo(() => {
    return geographicDistributionData.filter((geoArea) => geoArea.tipo === "transversal");
  }, [geographicDistributionData]);

  const [totalFundedValue, totalFundedSuffix] = formatCompactEUR(
    Number(countryData.length > 0 ? countryData[0].valor_financiamento_total : 0)
  );

  const totalFundedStr = useMemo(() => {
    return `${totalFundedValue} ${t(totalFundedSuffix)} €`;
  }, [totalFundedValue, totalFundedSuffix, t]);

  const hasDistributionRows = useMemo(() => {
    return (
      sortedAreasData.some((geoArea) => geoArea.distribuicao.length > 0) ||
      countryData.some(
        (geoArea) =>
          "distribuicao_indefinida" in geoArea && Boolean(geoArea.distribuicao_indefinida)
      )
    );
  }, [countryData, sortedAreasData]);
  return (
    <div className="flex w-full flex-col gap-64">
      <Typograph tag="h2" className="text-xl-bold text-primary-900">
        {title}
      </Typograph>

      <div className="grid grid-cols-12 items-center gap-x-24">
        <div className="col-span-12 xl:col-span-4">
          <BenProjSheet.CardLined
            title={totalFundedStr ?? ""}
            description={
              "description" in geographicDistribution[0]
                ? geographicDistribution[0].description
                : ""
            }
          />
        </div>
        <div className="col-span-12 hidden xl:col-span-3 xl:block">
          <div className="h-1/2 w-full border-b border-dashed border-b-neutral-500" />
        </div>

        <div className="col-span-12 hidden xl:col-span-3 xl:block">
          <BenProjSheet.CardGraph
            description={
              "description" in geographicDistribution[1]
                ? geographicDistribution[1].description
                : ""
            }
            graphValue={(Number(countryData[0].pc_valor_executado.toFixed(2)) ?? 0) * 100}
          />
        </div>

        {hasDistributionRows && (
          <div className="col-span-12 h-[170px] xl:col-span-3">
            <div className="relative h-full w-1/2 border-r border-dashed border-r-neutral-500">
              <RoundedIcon
                className="roundedIcon absolute top-1/2 right-0 z-10 translate-x-1/2 -translate-y-1/2"
                icon={{
                  name: "agora-line-arrow-down-anchor",
                  color: "white",
                  backgroundColor: "primary-600",
                }}
              />
            </div>
          </div>
        )}

        {hasDistributionRows && (
          <div className="col-span-12 hidden xl:col-span-9 xl:block" aria-hidden />
        )}

        {sortedAreasData.map((geoArea, index) => {
          let areaTitle = "";
          let areaSubtitle = "";
          if (geoArea.distribuicao.length === 0) {
            return null;
          }

          areaTitle = t("sheetBenProj.byArea", {
            area: t(`sheetBenProj.areas.${geoArea.tipo}`),
          });
          const areaStr = t(
            `sheetBenProj.areas.${geoArea.tipo}${geoArea.distribuicao.length > 1 ? "_pl" : ""}`
          );
          let fundedStr = "";
          switch (geoArea.tipo) {
            case "concelho":
              fundedStr = t(
                `sheetBenProj.financiado${geoArea.distribuicao.length > 1 ? "_pl" : ""}`
              );
              break;
            case "distrito":
              fundedStr = t(
                `sheetBenProj.financiado${geoArea.distribuicao.length > 1 ? "_pl" : ""}`
              );
              break;
            case "subregiao":
              fundedStr = t(
                `sheetBenProj.financiada${geoArea.distribuicao.length > 1 ? "_pl" : ""}`
              );
              break;
            case "regiao":
              fundedStr = t(
                `sheetBenProj.financiada${geoArea.distribuicao.length > 1 ? "_pl" : ""}`
              );
              break;
            default:
              break;
          }
          areaSubtitle = `${geoArea.distribuicao.length} ${areaStr} ${fundedStr}`;

          return (
            <div
              key={`geoArea-${index}`}
              className="col-span-12 flex flex-col gap-32 py-32 xl:col-span-7"
            >
              <div className="flex flex-col gap-8">
                <Typograph tag="p" className="text-l-bold text-primary-900">
                  {areaTitle}
                </Typograph>
                {areaSubtitle && (
                  <Typograph tag="p" className="text-s-regular text-primary-900">
                    {areaSubtitle}
                  </Typograph>
                )}
              </div>
              <List area={geoArea.tipo} items={geoArea.distribuicao} />
            </div>
          );
        })}

        {countryData.map((cd, index) => {
          if (!("distribuicao_indefinida" in cd) || !cd.distribuicao_indefinida) {
            return null;
          }

          return (
            <div
              key={`${cd.tipo}-${index}`}
              className="col-span-12 flex flex-col gap-32 py-32 xl:col-span-7"
            >
              <Typograph tag="p" className="text-l-bold text-primary-900">
                {t("sheetBenProj.nationwide")}
              </Typograph>
              <List
                area={cd.tipo}
                items={[
                  {
                    descricao: t("sheetBenProj.nationwide_line"),
                    valor_financiamento: Number(cd.distribuicao_indefinida),
                  },
                ]}
              />
            </div>
          );
        })}
      </div>

      {children}
    </div>
  );
}
