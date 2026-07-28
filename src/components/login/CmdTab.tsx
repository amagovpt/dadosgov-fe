"use client";

import { useState } from "react";
import NextImage from "next/image";
import { useTranslation } from "react-i18next";
import { Button, RadioButton } from "@ama-pt/agora-design-system";
import { PRIMARY_BUTTON_CLASS, TEXT_LINK_BUTTON_CLASS } from "./constants";
import { TermsSection } from "./LoginShared";
import { Typograph } from "../Shared/Generics/Typograph";

export function CmdTab({
  samlEnabled,
  onSamlLogin,
  onOpenModal,
}: {
  samlEnabled: boolean;
  onSamlLogin: () => void;
  onOpenModal: () => void;
}) {
  const { t } = useTranslation("login");
  const [citizenType, setCitizenType] = useState<string | null>(null);
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
              {t("cmd.intro")}
            </Typograph>
          </div>
          <div className="shrink-0">
            <NextImage
              src="/Logos/autenticacao_gov.svg"
              alt="Autenticação.gov"
              width={240}
              height={48}
            />
          </div>
        </div>
        <div className="my-32 flex items-center gap-8">
          <Typograph tag="p" className="text-sm text-neutral-900">
            <strong>{t("cmd.noAccountQuestion")}</strong>
          </Typograph>
          <button className={TEXT_LINK_BUTTON_CLASS} onClick={onOpenModal}>
            {t("cmd.discoverHowToCreate")}
          </button>
        </div>
        <div className="h-[2px] w-full bg-neutral-400" />
        <div className="flex flex-col gap-24">
          <div className="flex flex-col gap-8">
            <Typograph tag="h3" className="mt-32 text-l-bold text-brand-blue-dark">
              {t("cmd.loginAs")}
            </Typograph>
            <div className="mt-8 flex flex-col gap-16">
              <RadioButton
                label={t("cmd.citizenNational")}
                id="nacional"
                name="citizen-type"
                className="text-lg text-neutral-900"
                onChange={() => setCitizenType("nacional")}
              />
              <RadioButton
                label={t("cmd.citizenForeign")}
                id="estrangeiro"
                name="citizen-type"
                className="text-lg text-neutral-900"
                onChange={() => setCitizenType("estrangeiro")}
              />
            </div>
          </div>
          <TermsSection
            id="terms-cmd"
            checked={termsAccepted}
            onChange={setTermsAccepted}
          />
        </div>
        <div className="mt-16">
          <Button
            variant="primary"
            className={PRIMARY_BUTTON_CLASS}
            hasIcon={true}
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            onClick={onSamlLogin}
            disabled={!samlEnabled || !citizenType || !termsAccepted}
          >
            {t("cmd.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
