"use client";

import { useTranslation } from "react-i18next";
import { ChecklistItem, CloseButton, HoverArrowLink } from "./LoginShared";
import { Typograph } from "../Shared/Generics/Typograph";

export function EidasModalContent({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("login");

  return (
    <div className="mt-24 flex flex-col gap-24">
      <CloseButton onClick={onClose} />
      <Typograph tag="h2" className="text-xl-bold text-brand-blue-dark">
        {t("eidasModal.title")}
      </Typograph>
      <ul className="flex flex-col gap-16">
        <ChecklistItem>{t("eidasModal.item1")}</ChecklistItem>
      </ul>
      <div className="mt-32 flex flex-col items-start gap-24">
        <HoverArrowLink href="https://www.autenticacao.gov.pt/eidas">
          {t("eidasModal.createAccount")}
        </HoverArrowLink>
      </div>
    </div>
  );
}
