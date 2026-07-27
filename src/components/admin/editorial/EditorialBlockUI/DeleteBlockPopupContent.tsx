import { Button } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

export function DeleteBlockPopupContent({
  onClose,
  onConfirm,
  message,
}: {
  onClose: () => void;
  onConfirm: () => void;
  message?: string;
}) {
  const { t } = useTranslation(["admin-common", "admin-editorial"]);

  return (
    <div className="flex flex-col gap-16">
      <p>{message ?? t("admin-editorial:blockActions.deleteBlockMessage")}</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          {t("admin-common:actions.cancel")}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          {t("admin-common:actions.delete")}
        </Button>
      </div>
    </div>
  );
}
