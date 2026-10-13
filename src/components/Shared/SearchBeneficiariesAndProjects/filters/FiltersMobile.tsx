"use client";

import { Button, useModalContext } from "@ama-pt/agora-design-system";
import { ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";
import ModalRoot from "../../Modal/ModalRoot";
import ModalTrigger from "../../Modal/ModalTrigger";
import GroupTitle from "./GroupTitle";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import useMobile from "@/hooks/useMobile";

/** -------------------------------------------------------------------------------------------------------------------- */

interface IFiltersModalContent {
  children?: ReactNode;
  locale: string;
}

function FiltersModalContent({ children, locale }: IFiltersModalContent) {
  const { t } = useTranslation();

  const { hide } = useModalContext();

  const applyFilters = useSearchBenProjStore((state) => state.applyFilters);

  const handleApplyFilters = useCallback(() => {
    applyFilters(t, locale);
    hide();
  }, [applyFilters, t, locale, hide]);

  return (
    <div className="flex flex-col gap-32">
      <div className="flex flex-col gap-32 pb-32">
        <GroupTitle title={t("searchBenProj.filterSearch")} />

        <div className="h-[1px] w-full bg-neutral-700" />

        {children}
      </div>

      <div className="px-32 relative pt-16 ml-[-32px] mr-[32px] shadow-top-medium" style={{width: "calc(100% + 64px)"}}>
        <Button type="button" fullWidth onClick={() => handleApplyFilters()}>
          {t("searchBenProj.applyFilters")}
        </Button>
      </div>
    </div>
  );
}

/** -------------------------------------------------------------------------------------------------------------------- */

export interface IFiltersMobile {
  children?: ReactNode;
  locale: string;
}

export default function FiltersMobile({ children, locale }: IFiltersMobile) {
  const isMobile = useMobile();
  const { t } = useTranslation();

  const loading = useSearchBenProjStore((state) => state.loading);

  if (!isMobile) {
    return null;
  }

  return (
    <ModalRoot>
      <ModalTrigger
        content={
          <FiltersModalContent locale={locale}>{children}</FiltersModalContent>
        }
        modalConfig={{
          darkMode: false,
          className: "search-ben-proj bg-neutral-50",
        }}
        className="w-full"
      >
        <Button
          type="button"
          appearance="outline"
          hasIcon
          trailingIcon="agora-line-settings"
          trailingIconHover="agora-line-settings"
          fullWidth
          disabled={loading}
        >
          {t("searchBenProj.filterSearch")}
        </Button>
      </ModalTrigger>
    </ModalRoot>
  );
}
