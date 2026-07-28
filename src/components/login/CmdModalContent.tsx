"use client";

import { useTranslation } from "react-i18next";
import { ChecklistItem, CloseButton, HoverArrowLink } from "./LoginShared";
import { Typograph } from "../Shared/Generics/Typograph";

export function CmdModalContent({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("login");

  return (
    <div className="mt-24 flex flex-col gap-24">
      <CloseButton onClick={onClose} />
      <Typograph tag="h2" className="text-xl-bold text-brand-blue-dark">
        {t("cmdModal.title")}
      </Typograph>
      <ul className="flex flex-col gap-16">
        <ChecklistItem>{t("cmdModal.item1")}</ChecklistItem>
        <ChecklistItem>
          {t("cmdModal.item2Before")}
          <br />
          <a
            href="https://www.autenticacao.gov.pt/cmd-pedido-chave"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline"
          >
            {t("cmdModal.item2Link")}
          </a>
        </ChecklistItem>
        <ChecklistItem>{t("cmdModal.item3")}</ChecklistItem>
      </ul>
      <div className="mt-32 flex flex-col items-start gap-24">
        <HoverArrowLink href="https://www.autenticacao.gov.pt/cmd-pedido-chave?partnerEntityID=https://dados.gov.pt">
          {t("cmdModal.createNational")}
        </HoverArrowLink>
        <HoverArrowLink href="https://www.autenticacao.gov.pt/cmd-pedido-chave-estrangeiro">
          {t("cmdModal.createForeign")}
        </HoverArrowLink>
      </div>
    </div>
  );
}
