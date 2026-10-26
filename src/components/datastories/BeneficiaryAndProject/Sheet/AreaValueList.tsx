"use client";

import { formatCompactEUR } from "@/utils/formatCurrency";
import { useTranslation } from "react-i18next";
import { useId } from "react";
import { twMerge } from "tailwind-merge";
import { Typograph } from "@/components/Shared/Generics/Typograph";

/** ------------------------------------------------------------------------------------------------------ */

type AreaHeader = {
  area: string;
  value: string;
};

interface IListHeader {
  header: AreaHeader;
}

function ListHeader({ header }: IListHeader) {
  return (
    <li>
      <div className="w-full flex flex-row gap-32 pb-8 px-16">
        <div className="grow text-s-bold text-neutral-900">{header.area}</div>
        <div className="text-s-bold text-primary-900">{header.value}</div>
      </div>
    </li>
  );
}

/** ------------------------------------------------------------------------------------------------------ */

type AreaData = {
  area: string;
  value: number;
};

interface IListItem {
  item: AreaData;
  boldValues?: boolean;
}

function ListItem({ item, boldValues }: IListItem) {
  const { t } = useTranslation();

  const [exeValue, exeSuffix] = formatCompactEUR(Number(item.value));
  const valor_financiamento = `${exeValue} ${t(exeSuffix)} €`;

  return (
    <li>
      <div className="w-full flex flex-row gap-32 pb-8 px-16 border-b-2 border-b-neutral-200">
        <div className="grow text-m-regular text-neutral-900">{item.area}</div>
        <div
          className={twMerge(
            "text-primary-900",
            boldValues ? "text-m-bold" : "text-m-regular",
          )}
        >
          {valor_financiamento}
        </div>
      </div>
    </li>
  );
}

/** ------------------------------------------------------------------------------------------------------ */

interface IList {
  header?: AreaHeader;
  items: AreaData[];
}

function List({ header, items }: IList) {
  const id = useId();

  return (
    <ul className="w-full flex flex-col gap-8">
      {header && <ListHeader header={header} />}
      {items.map((item, index) => {
        return <ListItem key={`list-${id}-${index}`} item={item} />;
      })}
    </ul>
  );
}

/** ------------------------------------------------------------------------------------------------------ */

export interface IAreaValuelist extends IList {
  areaTitle?: string;
  areaSubtitle?: string;
}

export default function AreaValuelist({
  areaTitle,
  areaSubtitle,
  header,
  items,
}: IAreaValuelist) {
  const hasAreaInfo = areaTitle || areaSubtitle;

  return (
    <div className="col-span-12 xl:col-span-7 flex flex-col gap-32">
      {hasAreaInfo && (
        <div className="flex flex-col gap-8">
          {areaTitle && (
            <Typograph tag="p" className="text-l-bold text-primary-900">
              {areaTitle}
            </Typograph>
          )}
          {areaSubtitle && (
            <Typograph tag="p" className="text-s-regular text-primary-900">
              {areaSubtitle}
            </Typograph>
          )}
        </div>
      )}

      <List header={header} items={items} />
    </div>
  );
}

/** ------------------------------------------------------------------------------------------------------ */
