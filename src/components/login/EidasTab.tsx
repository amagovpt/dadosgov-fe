"use client";

import { useState } from "react";
import NextImage from "next/image";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import { PRIMARY_BUTTON_CLASS, TEXT_LINK_BUTTON_CLASS } from "./constants";
import { TermsSection } from "./LoginShared";
import { Typograph } from "../Shared/Generics/Typograph";

export function EidasTab({
  samlEnabled,
  onEidasLogin,
  onOpenModal,
}: {
  samlEnabled: boolean;
  onEidasLogin: () => void;
  onOpenModal: () => void;
}) {
  const { t } = useTranslation("login");
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="rounded-8">
      <div className="flex flex-col gap-40">
        <div className="flex items-center justify-between gap-32">
          <div className="flex flex-col gap-8">
            <Typograph tag="h2" className="text-base font-bold text-brand-blue-dark">
              {t("beforeStart.title")}
            </Typograph>
            <Typograph tag="p" className="text-neutral-900">
              {t("eidas.intro")}
            </Typograph>
          </div>
          <div className="flex shrink-0 items-center gap-32">
            <NextImage src="/eidas.svg" alt="eIDAS" width={64} height={64} />
            <NextImage src="/Logos/your_europe.svg" alt="Your Europe" width={120} height={48} />
          </div>
        </div>
        <div className="mt-32 flex items-center gap-8">
          <Typograph tag="p" className="text-sm text-neutral-900">
            <strong>{t("eidas.noAccountQuestion")}</strong>
          </Typograph>
          <button className={TEXT_LINK_BUTTON_CLASS} onClick={onOpenModal}>
            {t("eidas.discoverHowToCreate")}
          </button>
        </div>
        <div className="my-32 h-[2px] w-full bg-neutral-400" />
        <Typograph tag="p" className="text-sm text-neutral-900">
          {t("eidas.documentsPart1")}
          <strong>{t("eidas.documentsBold1")}</strong>
          {t("eidas.documentsPart2")}
          <strong>{t("eidas.documentsBold2")}</strong>
          {t("eidas.documentsPart3")}
        </Typograph>
        <TermsSection
          id="terms-eidas"
          checked={termsAccepted}
          onChange={setTermsAccepted}
        />
        <div className="mt-16">
          <Button
            variant="primary"
            className={PRIMARY_BUTTON_CLASS}
            hasIcon={true}
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            onClick={onEidasLogin}
            disabled={!samlEnabled || !termsAccepted}
          >
            {t("eidas.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
