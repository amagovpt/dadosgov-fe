"use client";

import { useTranslation } from "react-i18next";
import { FaqLink } from "../FaqLink";

export function LegaisAnswer() {
  const { t } = useTranslation("support");

  return (
    <div className="space-y-16">
      <div>
        <p className="font-bold">{t("legalAnswers.personalDataTitle")}</p>
        <p>
          {t("legalAnswers.contactPrefix")}{" "}
          <FaqLink href="https://www.cnpd.pt">
            {t("legalAnswers.cnpdLink")}
          </FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">{t("legalAnswers.removalRequestTitle")}</p>
        <p>
          {t("legalAnswers.supportPrefix")}{" "}
          <FaqLink href="/ajuda-e-contactos#help">
            {t("legalAnswers.supportLink")}
          </FaqLink>
        </p>
      </div>
    </div>
  );
}
