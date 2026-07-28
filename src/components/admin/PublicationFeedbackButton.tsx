"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";

const SUPPORT_PAGE_PATH = "/ajuda-e-contactos?toggle=feedback#ajuda";

export default function PublicationFeedbackButton() {
  const { t } = useTranslation("admin-common");

  return (
    <Button
      appearance="link"
      variant="primary"
      hasIcon
      trailingIcon="agora-line-external-link"
      trailingIconHover="agora-solid-external-link"
      onClick={() => window.open(SUPPORT_PAGE_PATH, "_blank", "noopener,noreferrer")}
    >
      {t("feedback.publicationProcess")}
    </Button>
  );
}
