"use client";

import { InputSearchBar } from "@ama-pt/agora-design-system";
import { Trans, useTranslation } from "react-i18next";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect } from "react";
import RadioButtonGroup, { RadioButtonOption } from "../../RadioButtonGroup";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";

export interface IHeroContentSearchBenProj {
  subject: "beneficiaries" | "projects";
  locale: string;
  darkMode?: boolean;
  label?: string;
  placeholder?: string;
  showTotal?: boolean;
}

export default function HeroContentSearchBenProj({
  subject,
  locale,
  darkMode = true,
  label,
  placeholder,
  showTotal = false,
}: IHeroContentSearchBenProj) {
  const { t } = useTranslation();

  const initFromURL = useSearchBenProjStore((state) => state.initFromURL);
  const filters = useSearchBenProjStore((state) => state.filters);
  const addFilter = useSearchBenProjStore((state) => state.addFilter);
  const applyFilter = useSearchBenProjStore((state) => state.applyFilter);
  const searchBy = useSearchBenProjStore((state) => state.searchBy);
  const setSearchBy = useSearchBenProjStore((state) => state.setSearchBy);
  const loading = useSearchBenProjStore((state) => state.loading);
  const search = useSearchBenProjStore((state) => state.search);
  const total = useSearchBenProjStore((state) => state.total);

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (typeof event.target.value === "string") {
        setSearchBy(event.target.value);
      }
    },
    [setSearchBy],
  );

  const handleQueryChange = useCallback(
    (value: string) => {
      addFilter("query", value, t, locale);
    },
    [addFilter, t, locale],
  );

  const handleClickEnter = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        applyFilter("query", t, locale);
        search();
      }
    },
    [search, applyFilter, t, locale],
  );

  const subjectLabel =
    subject === "beneficiaries" ? t("searchBenProj.beneficiary") : t("searchBenProj.project");

  const radioButtons: RadioButtonOption[] = [
    { label: t("searchBenProj.hero.searchByName"), value: "name", key: "name" },

    subject === "beneficiaries"
      ? { label: t("searchBenProj.hero.searchByNif"), value: "nif", key: "nif" }
      : {
          label: t("searchBenProj.hero.searchByOperationCode"),
          value: "operationCode",
          key: "operationCode",
        },
  ];

  const searchLabel = label || `${t("pesquisar")} ${subjectLabel}`;
  // the CMS placeholder is written for the default "search by name" option
  const searchPlaceholder =
    placeholder && searchBy === "name"
      ? placeholder
      : t("searchBenProj.hero.searchPlaceholder", {
          searchBy: t(searchBy),
          subject: subjectLabel,
        });

  useEffect(() => {
    initFromURL(t, locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-32">
      <RadioButtonGroup
        options={radioButtons}
        darkMode={darkMode}
        value={searchBy}
        onChange={handleFilterChange}
        className="flex-col xl:flex-row"
      />

      <div className="grid grid-cols-12 gap-x-32">
        <InputSearchBar
          label={searchLabel}
          placeholder={searchPlaceholder}
          className="col-span-12 xl:col-span-7"
          value={(filters.query ?? "") as string}
          onChange={(e) => handleQueryChange(e.target.value)}
          onSearchActivate={() => {
            applyFilter("query", t, locale);
            search();
          }}
          onKeyDown={handleClickEnter}
          disabled={loading}
        />
      </div>

      {showTotal && total > 0 && (
        <p className="text-m-regular text-neutral-900">
          <Trans
            i18nKey={
              subject === "beneficiaries"
                ? "searchBenProj.hero.subtitle"
                : "searchBenProj.hero.subtitleProjects"
            }
            values={{
              total: total.toLocaleString("pt-PT"),
              subject: t(`searchBenProj.${subject}`),
            }}
            components={{ strong: <strong /> }}
          />
        </p>
      )}
    </div>
  );
}
