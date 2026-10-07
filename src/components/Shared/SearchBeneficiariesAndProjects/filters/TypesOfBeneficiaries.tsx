"use client";

import { Switch } from "@ama-pt/agora-design-system";
import GroupTitle from "./GroupTitle";
import { Typograph } from "../../Generics/Typograph";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { ChangeEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useMobile from "@/hooks/useMobile";

export type TypeOption = {
  name: string;
  title: string;
  subtitle: string;
};

export interface ITypesOfBeneficiaries {
  title: string;
  options: TypeOption[];
  locale: string;
}

export default function TypesOfBeneficiaries({
  title,
  options,
  locale,
}: ITypesOfBeneficiaries) {
  const { t } = useTranslation();

  const isMobile = useMobile();

  const { filters, addFilter } = useSearchBenProjStore((state) => state);

  const filterToBoolean = (value: unknown) => {
    return typeof value === "boolean" ? (value as boolean) : value === "true";
  };

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      addFilter(
        event.target.name,
        !(filters[event.target.name] as boolean),
        t,
        locale,
        isMobile,
      );
    },
    [addFilter, filters, t, locale, isMobile],
  );

  return (
    <div className="flex flex-col gap-16">
      <GroupTitle title={title} />
      {options.map((o, i) => {
        const value = filterToBoolean(filters[o.name]);

        return (
          <label
            key={`benType-${i}`}
            className="flex gap-16 items-start cursor-pointer"
          >
            <div className="w-full flex flex-col gap-0 text-m-regular">
              <Typograph tag="p" className="text-neutral-900">
                {o.title}
              </Typograph>
              <Typograph tag="p" className="text-neutral-700">
                {o.subtitle}
              </Typograph>
            </div>
            <Switch
              id={`benType-${i}`}
              name={o.name}
              checked={value}
              onChange={handleChange}
            />
          </label>
        );
      })}
    </div>
  );
}
