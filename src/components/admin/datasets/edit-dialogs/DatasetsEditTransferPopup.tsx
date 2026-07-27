import Link from "next/link";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Icon, InputTextArea } from "@ama-pt/agora-design-system";
import RecipientSelect, {
  type RecipientSelection,
} from "@/components/admin/RecipientSelect";

type DatasetsEditTransferPopupProps = {
  datasetTitle: string;
  onConfirm: (recipient: RecipientSelection, comment: string) => Promise<void>;
};

export default function DatasetsEditTransferPopup({
  datasetTitle,
  onConfirm,
}: DatasetsEditTransferPopupProps) {
  const { t } = useTranslation("admin-datasets");
  const [recipient, setRecipient] = useState<RecipientSelection | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecipientError, setShowRecipientError] = useState(false);

  const handleConfirm = async () => {
    if (!recipient) {
      setShowRecipientError(true);
      return;
    }
    setShowRecipientError(false);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm(recipient, comment.trim());
    } catch (error) {
      const msg = error instanceof Error ? error.message : null;
      setErrorMessage(msg || t("edit.transferError"));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-16">
      <p>
        <Icon name="agora-line-document" className="mr-4 inline h-4 w-4" />
        <span className="text-primary-600">{datasetTitle}</span>
      </p>
      <p>
        <strong>{t("edit.transferIrreversible")}</strong>&nbsp; {t("edit.transferWarning")}
      </p>

      <div className="flex flex-col gap-8">
        <label className="text-primary-900 text-base font-medium leading-7">
          {t("edit.transferRecipientLabel")} <span className="text-danger-600">*</span>
        </label>
        <RecipientSelect
          id="transfer-dataset-recipient"
          placeholder={t("edit.transferRecipientPlaceholder")}
          onChange={(selection) => {
            setRecipient(selection);
            if (selection) setShowRecipientError(false);
          }}
          hasError={showRecipientError}
          errorFeedbackText={t("edit.transferRecipientRequired")}
        />
        {recipient && (
          <p className="text-sm text-neutral-700">
            {t("edit.transferSelectedRecipient")}{" "}
            <strong className="text-primary-900">{recipient.label}</strong>{" "}
            <span className="text-neutral-500">
              (
              {recipient.class === "User"
                ? t("edit.transferUserType")
                : t("edit.transferOrganizationType")}
              )
            </span>
          </p>
        )}
      </div>

      <div className="admin-page__org-card flex flex-col items-center gap-16 rounded-lg bg-neutral-50 p-8 text-center">
        <h3 className="text-primary-900 text-lg font-bold leading-7">
          {t("edit.transferNoOrganizationTitle")}
        </h3>
        <p className="text-base leading-7 text-neutral-700">
          {t("edit.transferNoOrganizationDescription")}
        </p>
        <Link
          href="/admin/organizations"
          className="inline-flex items-center text-base text-primary-500 hover:underline"
        >
          <span className="mr-[5px]">{t("edit.transferOrganizationLink")}</span>
          <Icon name="agora-line-arrow-right-circle" className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex flex-col gap-8">
        <label className="text-primary-900 text-base font-medium leading-7">
          {t("edit.transferCommentLabel")}
        </label>
        <InputTextArea
          placeholder={t("edit.transferCommentPlaceholder")}
          id="transfer-dataset-comment"
          label=""
          rows={3}
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
        />
      </div>

      {errorMessage && <p className="text-sm text-danger-600">{errorMessage}</p>}

      <div className="flex justify-end gap-16 pt-16">
        <Button
          appearance="solid"
          variant="primary"
          hasIcon
          leadingIcon="agora-line-plane"
          leadingIconHover="agora-solid-plane"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("edit.transferring") : t("edit.transferAction")}
        </Button>
      </div>
    </div>
  );
}
