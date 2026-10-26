"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  Icon,
  InputTextArea,
  StatusCard,
  type DialogElement,
} from "@ama-pt/agora-design-system";
import RecipientSelect, { type RecipientSelection } from "@/components/admin/RecipientSelect";
import { useAuth } from "@/context/AuthContext";
import { localizeHref } from "@/utils/localizeHref";
import { DatasetContentDescription, useDatasetContent } from "../DatasetContentProvider";

interface DatasetsEditTransferPopupProps {
  onClose: () => void;
  onConfirm: (recipient: RecipientSelection, comment: string) => Promise<void>;
}

export default function DatasetsEditTransferPopup({
  onClose,
  onConfirm,
}: DatasetsEditTransferPopupProps) {
  const { t, i18n } = useTranslation("admin-datasets");
  const { transferIntroduction } = useDatasetContent();
  const { user, hasOrganization, isLoading: isUserLoading } = useAuth();
  const id = useId();
  const dialogRef = useRef<DialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [recipient, setRecipient] = useState<RecipientSelection | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecipientError, setShowRecipientError] = useState(false);

  useLayoutEffect(() => {
    const trigger = document.activeElement;
    const ownDialog = dialogRef.current;
    return () => {
      const anotherDialogOpen = Array.from(
        document.querySelectorAll(".agora-dialog:not(.closed)")
      ).some((dialog) => dialog !== ownDialog);
      document.body.classList.toggle("overflow-hidden", anotherDialogOpen);
      if (trigger instanceof HTMLElement)
        requestAnimationFrame(() => {
          if (!ownDialog?.isConnected && trigger.isConnected) trigger.focus();
        });
    };
  }, []);

  async function handleConfirm() {
    if (submitting.current) return;
    if (!recipient) {
      setShowRecipientError(true);
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-haspopup="listbox"], [aria-invalid="true"]')
          ?.focus()
      );
      return;
    }
    submitting.current = true;
    setShowRecipientError(false);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm(recipient, comment.trim());
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("edit.transferError"));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  function close() {
    if (!submitting.current) onClose();
  }

  return createPortal(
    <Dialog
      ref={dialogRef}
      visible
      fullScreen
      dismissOnEscape={!isSubmitting}
      onHide={close}
      aria-labelledby={`${id}-title`}
      aria-busy={isSubmitting}
    >
      <div className="h-full w-full overflow-y-auto bg-white text-neutral-900 [&_.input-label-wrapper]:mb-8">
        <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col">
          <div className="flex h-[76px] shrink-0 items-start justify-end px-16 pt-16">
            <Button
              type="button"
              appearance="link"
              variant="neutral"
              hasIcon
              trailingIcon="agora-line-x"
              trailingIconHover="agora-solid-x"
              className="h-[60px]! min-h-[60px]! py-[14px]!"
              disabled={isSubmitting}
              onClick={close}
            >
              {t("edit.closeAriaLabel")}
            </Button>
          </div>
          <div className="px-24 py-32 md:px-32 md:py-64">
            <form
              ref={formRef}
              noValidate
              className="mx-auto flex w-full max-w-[800px] flex-col gap-64"
              onSubmit={(event) => {
                event.preventDefault();
                void handleConfirm();
              }}
            >
              <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-32">
                <legend className="sr-only">{transferIntroduction?.title ?? ""}</legend>
                <div className="flex max-w-[592px] flex-col gap-16">
                  <h2 id={`${id}-title`} className="text-2xl-bold">
                    {transferIntroduction?.title ?? ""}
                  </h2>
                  <DatasetContentDescription
                    html={transferIntroduction?.description}
                    className="text-m-regular"
                  />
                </div>
                <StatusCard
                  variant="warning"
                  description={
                    <div className="flex items-start gap-8">
                      <Icon
                        name="agora-solid-alert-circle"
                        className="mt-2 size-24 shrink-0 fill-warning-600"
                      />
                      <div className="flex min-w-0 flex-col gap-8 text-m-regular">
                        <p className="text-m-bold">{t("transfer.warningTitle")}</p>
                        <p>{t("transfer.warningDescription")}</p>
                      </div>
                    </div>
                  }
                />
                <section
                  className="flex min-w-0 flex-col gap-32"
                  aria-labelledby={`${id}-owner-title`}
                >
                  <div className="flex max-w-[592px] flex-col gap-16">
                    <h3 id={`${id}-owner-title`} className="text-xl-bold">
                      {t("transfer.ownerTitle")}
                    </h3>
                    <p className="text-m-regular">{t("transfer.ownerDescription")}</p>
                  </div>
                  {!isUserLoading && user && !hasOrganization && (
                    <StatusCard
                      variant="outline-informative"
                      showIcon
                      title={t("list.noOrganizationTitle")}
                      description={t("list.noOrganizationDescription")}
                      anchorOnRightSide
                      anchor={{
                        href: localizeHref("/admin/organizations/new", i18n.language),
                        "aria-label": t("form.organizationLink"),
                        hasIcon: true,
                        iconOnly: true,
                        trailingIcon: "agora-solid-arrow-right-circle",
                        trailingIconHover: "agora-solid-arrow-right-circle",
                      }}
                    />
                  )}
                  <RecipientSelect
                    id={`${id}-recipient`}
                    label={t("edit.transferRecipientLabel")}
                    required
                    placeholder={t("edit.transferRecipientPlaceholder")}
                    onChange={(selection) => {
                      setRecipient(selection);
                      if (selection) setShowRecipientError(false);
                    }}
                    hasError={showRecipientError}
                    errorFeedbackText={t("edit.transferRecipientRequired")}
                  />
                </section>
                <div className="w-full max-w-[592px]">
                  <InputTextArea
                    id={`${id}-notes`}
                    label={t("transfer.notes")}
                    className="h-[144px] min-h-[144px]"
                    rows={4}
                    maxLength={3000}
                    required={false}
                    aria-description={t("resourceEditor.optional")}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                  <div className="mt-8 flex items-start justify-between gap-16">
                    <span className="flex items-center gap-8 text-s-regular text-neutral-700">
                      <Icon
                        name="agora-solid-info-mark"
                        dimensions="xs"
                        className="shrink-0 fill-informative-500"
                        aria-hidden
                      />
                      {t("resourceEditor.optional")}
                    </span>
                    <span className="shrink-0 text-s-regular text-neutral-700">
                      {comment.length} / 3000
                    </span>
                  </div>
                </div>
                {errorMessage && (
                  <StatusCard
                    variant="danger"
                    showIcon
                    description={<span role="alert">{errorMessage}</span>}
                  />
                )}
              </fieldset>
              <div className="flex flex-wrap items-center justify-end gap-16">
                <Button
                  type="button"
                  appearance="link"
                  variant="neutral"
                  className="h-[60px]! min-h-[60px]! py-[14px]!"
                  disabled={isSubmitting}
                  onClick={close}
                >
                  {t("edit.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  hasIcon
                  leadingIcon="agora-line-upload"
                  leadingIconHover="agora-solid-upload"
                  className="h-[60px]! min-h-[60px]! py-[14px]!"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("edit.transferring") : t("transfer.action")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Dialog>,
    document.body
  );
}
