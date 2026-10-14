"use client";


import { Typograph } from "@/components/Shared/Generics/Typograph";
import { DistributionItem, GeographicDistribution, TerritorialDistribution, TransversalDistribution } from "@/service/types/datastories/pt2030/pt2030";
import { Card } from "@/service/types/shared/common";
import { formatCompactEUR, formatCurrency } from "@/utils/formatCurrency";
import { Button } from "@ama-pt/agora-design-system";
import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BenProjSheet } from "../Sheet";
import RoundedIcon from "@/components/Primitives/RoundedIcon";

export interface IBenProjSheetTabGeographicDistribution {
  title: string;
  geographicDistribution:
    | Card[]
  geographicDistributionData: GeographicDistribution[];
  children?: ReactNode;
}

interface IListItem {
  item: DistributionItem;
}

function TableRow({ item }: IListItem) {
  const { t } = useTranslation();

  return (
    <tr>
      <td className="grow text-neutral-900 pb-8 pl-32 pr-16 border-b-1 border-b-neutral-500">
        {item.descricao}
      </td>
      <td className="text-right text-m-bold text-primary-900 pb-8 pl-16 pr-16 border-b-1 border-b-neutral-500">
        {formatCurrency(item.pc_valor_executado ?? 0, t)}
      </td>
      <td className="text-right text-m-bold text-primary-900 pb-8 pl-16 pr-32 border-b-1 border-b-neutral-500">
        {formatCurrency(item.valor_pago ?? 0, t)}
      </td>
    </tr>
  );
}

interface IList {
  area: string;
  items: DistributionItem[];
}

function Table({ area, items }: IList) {
  const { t } = useTranslation();

  const [itemsShown, setItemsShown] = useState(5);

  const total = useMemo(() => items.length, [items]);

  const list = useMemo(() => items.slice(0, itemsShown), [items, itemsShown]);

  const handleSeeMore = () => {
    setItemsShown((prev) => Math.min(prev + 5, total));
  };

  return (
    <div className="flex flex-col gap-16">
      <table className="border-separate border-spacing-y-8">
        <thead>
          <tr>
            <td className="grow pb-8 pl-32 pr-16" />
            <td className="text-right text-s-regular text-primary-900 w-[25%] pb-8 pl-16 pr-16">
              {t("executedValue")}
            </td>
            <td className="text-right text-s-regular text-primary-900 w-[25%] pb-8 pl-16 pr-32">
              {t("amountPaid")}
            </td>
          </tr>
        </thead>
        <tbody>
          {list.map((item, index) => {
            return <TableRow key={`list-${area}-${index}`} item={item} />;
          })}
        </tbody>
      </table>
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
    return geographicDistributionData.filter(
      (geoArea) => geoArea.tipo !== "transversal",
    );
  }, [geographicDistributionData]);

  const sortedAreasData = useMemo(() => {
    return areasData.sort((a, b) => a.order - b.order);
  }, [areasData]);

  const areasWithDistribution = useMemo(() => {
    return sortedAreasData.filter((geoArea) => geoArea.distribuicao?.length);
  }, [sortedAreasData]);

  const shouldRenderFallbackArea = useMemo(() => {
    return sortedAreasData.length > 0 && areasWithDistribution.length === 0;
  }, [areasWithDistribution.length, sortedAreasData.length]);

  const countryData: TransversalDistribution[] = useMemo(() => {
    return geographicDistributionData.filter(
      (geoArea) => geoArea.tipo === "transversal",
    );
  }, [geographicDistributionData]);

  const [totalFundedValue, totalFundedSuffix] = formatCompactEUR(
    Number(
      countryData.length > 0 ? countryData[0].valor_financiamento_total : 0,
    ),
  );

  const totalFundedStr = useMemo(() => {
    return `${totalFundedValue} ${t(totalFundedSuffix)} €`;
  }, [totalFundedValue, totalFundedSuffix, t]);

  return (
    <div className="w-full flex flex-col gap-64 py-64">
      <Typograph tag="h2" className="text-xl-bold text-primary-900">
        {title}
      </Typograph>

      <div className="grid grid-cols-12 gap-x-24 items-center">
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
        <div className="col-span-12 xl:col-span-3 hidden xl:block">
          <div className="w-full h-1/2 border-b-1 border-dashed border-b-neutral-500" />
        </div>

        <div className="col-span-12 xl:col-span-3 hidden xl:block">
          <BenProjSheet.CardGraph
            description={
              "description" in geographicDistribution[1]
                ? geographicDistribution[1].description
                : ""
            }
            graphValue={(countryData[0].pc_valor_executado ?? 0) * 100}
          />
        </div>

        <div className="col-span-12 xl:col-span-3 h-[170px]">
          <div className="w-1/2 h-full border-r-1 border-dashed border-r-neutral-500 relative">
            <RoundedIcon
              className="roundedIcon z-10 absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2"
              icon={{
                name: "agora-line-arrow-down-anchor",
                color: "white",
                backgroundColor: "fundo-europeu-500",
              }}
            />
          </div>
        </div>

        <div
          className="col-span-12 xl:col-span-9 hidden xl:block"
          aria-hidden
        />

        {areasWithDistribution.map((geoArea, index) => {
          let areaTitle = "";
          let areaSubtitle = "";

          areaTitle = t("sheetBenProj.byArea", {
            area: t(`sheetBenProj.areas.${geoArea.tipo}`),
          });
          const areaStr = t(
            `sheetBenProj.areas.${geoArea.tipo}${geoArea.distribuicao.length > 1 ? "_pl" : ""}`,
          );
          let fundedStr = "";
          switch (geoArea.tipo) {
            case "concelho":
              fundedStr = t(
                `sheetBenProj.financiado${geoArea.distribuicao.length > 1 ? "_pl" : ""}`,
              );
              break;
            case "distrito":
              fundedStr = t(
                `sheetBenProj.financiado${geoArea.distribuicao.length > 1 ? "_pl" : ""}`,
              );
              break;
            case "subregiao":
              fundedStr = t(
                `sheetBenProj.financiada${geoArea.distribuicao.length > 1 ? "_pl" : ""}`,
              );
              break;
            case "regiao":
              fundedStr = t(
                `sheetBenProj.financiada${geoArea.distribuicao.length > 1 ? "_pl" : ""}`,
              );
              break;
            default:
              break;
          }
          areaSubtitle = `${geoArea.distribuicao.length} ${areaStr} ${fundedStr}`;

          const distribuicao = geoArea.distribuicao.map(
            ({ descricao, valor_pago }) => ({
              descricao,
              valor_pago,
              pc_valor_executado: geoArea?.pc_valor_executado || 0,
            }),
          );

          return (
            <div
              key={`geoArea-${index}`}
              className="col-span-12 xl:col-span-7 flex flex-col gap-32 py-32"
            >
              <div className="flex flex-col gap-8 pl-[4.5rem]">
                <Typograph tag="p" className="text-l-bold text-primary-900">
                  {areaTitle}
                </Typograph>
                {areaSubtitle && (
                  <Typograph
                    tag="p"
                    className="text-s-regular text-primary-900"
                  >
                    {areaSubtitle}
                  </Typograph>
                )}
              </div>
              <Table area={areaStr} items={distribuicao} />
            </div>
          );
        })}

        {shouldRenderFallbackArea && (
          <div className="col-span-12 xl:col-span-7 flex flex-col gap-32 py-32">
            <div className="flex flex-col gap-8 pl-[2.5rem]">
              <Typograph tag="p" className="mt-90 pb-10 text-primary-900">
                {t(`sheetBenProj.ondeFoiAplicado`)}
              </Typograph>
            </div>
          </div>
        )}

        {countryData.map((cd, index) => {
          if (
            !("distribuicao_indefinida" in cd) ||
            !cd.distribuicao_indefinida
          ) {
            return null;
          }

          return (
            <div
              key={`${cd.tipo}-${index}`}
              className="col-span-12 xl:col-span-7 flex flex-col gap-32 py-32"
            >
              <Typograph tag="p" className="text-l-bold text-primary-900">
                {t("sheetBenProj.nationwide")}
              </Typograph>
              <Table
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
