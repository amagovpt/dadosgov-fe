"use client";

import { useTranslation } from "react-i18next";
import { Button, usePopupContext } from "@ama-pt/agora-design-system";

interface DeleteAvatarPopupContentProps {
  onConfirm: () => Promise<void>;
}

export function DeleteAvatarPopupContent({ onConfirm }: DeleteAvatarPopupContentProps) {
  const { t } = useTranslation(["admin-common", "admin-profile"]);
  const { hide } = usePopupContext();

  const handleConfirm = async () => {
    hide();
    await onConfirm();
  };

  return (
    <div className="flex flex-col gap-24">
      <p>{t("admin-profile:deleteAvatarPopup.description")}</p>
      <div className="flex gap-16">
        <Button appearance="outline" variant="neutral" onClick={() => hide()}>
          {t("admin-common:actions.cancel")}
        </Button>
        <Button appearance="solid" variant="danger" onClick={handleConfirm}>
          {t("admin-common:actions.delete")}
        </Button>
      </div>
    </div>
  );
}
