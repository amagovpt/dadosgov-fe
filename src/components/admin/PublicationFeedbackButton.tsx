"use client";

import { Button } from "@ama-pt/agora-design-system";

const SUPPORT_PAGE_PATH = "/pages/support?toggle=feedback#ajuda";

export default function PublicationFeedbackButton() {
  return (
    <Button
      appearance="link"
      variant="primary"
      hasIcon
      trailingIcon="agora-line-external-link"
      trailingIconHover="agora-solid-external-link"
      onClick={() => window.open(SUPPORT_PAGE_PATH, "_blank", "noopener,noreferrer")}
    >
      Dê-nos o seu feedback sobre o processo de publicação.
    </Button>
  );
}
