"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import AppIcon from "@/components/Primitives/AppIcon";
import TextLink from "@/components/Primitives/TextLink";
import { i18nConfig } from "@/config/i18nConfig";
import { findNotificationTransfer } from "@/components/admin/notifications/notification-helpers";
import { respondToTransfer } from "@/service/api/transfers";
import type { TransferRequestNotificationDetails } from "@/service/types/notifications-reporting";
import type { Transfer } from "@/service/types/transfer-system";

interface TransferNotificationRowProps {
  createdAt: string;
  details: TransferRequestNotificationDetails;
  loadTransfers: (recipient: string) => Promise<Transfer[]>;
  onRetryTransfers: (recipient: string) => void;
  onResponded: (respondedAt: string) => void;
}

export default function TransferNotificationRow({
  createdAt,
  details,
  loadTransfers,
  onRetryTransfers,
  onResponded,
}: TransferNotificationRowProps) {
  const { t, i18n } = useTranslation("admin-notifications");
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [responseFailed, setResponseFailed] = useState(false);
  const [submitting, setSubmitting] = useState<"accept" | "refuse" | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTransfer() {
      setIsLoading(true);
      setLoadFailed(false);
      try {
        const subject = details.transfer_subject;
        const recipient = details.transfer_recipient;
        const transfers = subject && recipient ? await loadTransfers(recipient.id) : [];
        if (!cancelled) {
          setTransfer(findNotificationTransfer(details, createdAt, transfers));
        }
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadTransfer();
    return () => {
      cancelled = true;
    };
  }, [createdAt, details, loadTransfers, retryCount]);

  async function handleRespond(response: "accept" | "refuse") {
    if (!transfer || transfer.status !== "pending" || submitting) return;
    setSubmitting(response);
    setResponseFailed(false);
    try {
      const updated = await respondToTransfer(transfer.id, response);
      setTransfer(updated);
      onResponded(updated.responded || new Date().toISOString());
    } catch {
      setResponseFailed(true);
    } finally {
      setSubmitting(null);
    }
  }

  const owner = details.transfer_owner;
  const ownerName = owner?.name || [owner?.first_name, owner?.last_name].filter(Boolean).join(" ");
  const subject = details.transfer_subject;
  // Dataset notification references may only contain an ID and class. The
  // transfer endpoint includes the dataset title in its expanded subject.
  const subjectTitle = subject?.title || transfer?.subject?.title;
  const resourcePath =
    subject?.class === "Dataset" ? "datasets" : subject?.class === "Reuse" ? "reuses" : null;
  const locale =
    (i18n.resolvedLanguage || i18n.language)?.split("-")[0] || i18nConfig.defaultLocale;
  const viewHref =
    subject?.id && resourcePath
      ? `/${locale}/${resourcePath}/${encodeURIComponent(subject.slug || transfer?.subject?.slug || subject.id)}`
      : null;

  return (
    <div className="flex flex-col justify-between gap-16 md:flex-row md:items-start">
      <div className="flex min-w-0 flex-col gap-8">
        <div className="flex items-center gap-8">
          <AppIcon name="agora-line-mega-phone" />
          <span className="text-base font-medium text-primary-900">
            {t("transfer.title", {
              resource: t(`transfer.resources.${subject?.class ?? "unknown"}`),
            })}
          </span>
        </div>
        <p className="text-base text-neutral-900">
          {subjectTitle ||
            (subject ? t(`transfer.resources.${subject.class}`) : t("transfer.subjectUnavailable"))}
        </p>
        {viewHref && (
          <TextLink
            href={viewHref}
            target="_blank"
            className="inline-flex w-fit items-center gap-8"
          >
            <AppIcon name="agora-line-eye" />
            {t(`transfer.view.${subject!.class}`)}
          </TextLink>
        )}
        {ownerName && (
          <p className="text-base text-neutral-700">{t("transfer.from", { owner: ownerName })}</p>
        )}
        {transfer?.comment && <p className="text-base text-neutral-700">{transfer.comment}</p>}
        <p className="text-sm text-neutral-500">
          {format(new Date(createdAt), "dd/MM/yyyy HH:mm")}
        </p>
        {isLoading ? (
          <p className="text-sm text-neutral-700">{t("transfer.loading")}</p>
        ) : loadFailed ? (
          <p role="alert" className="text-sm text-danger-600">
            {t("transfer.loadError")}
          </p>
        ) : transfer && transfer.status !== "pending" ? (
          <p role="status" className="text-sm text-neutral-700">
            {t(`transfer.statuses.${transfer.status}`)}
          </p>
        ) : !transfer ? (
          <p className="text-sm text-neutral-700">{t("transfer.unavailable")}</p>
        ) : null}
        {responseFailed && (
          <p role="alert" className="text-sm text-danger-600">
            {t("transfer.responseError")}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-8">
        {!isLoading && !loadFailed && transfer?.status === "pending" && (
          <>
            <Button
              variant="primary"
              disabled={submitting !== null}
              onClick={() => handleRespond("accept")}
            >
              {submitting === "accept" ? t("transfer.accepting") : t("transfer.accept")}
            </Button>
            <Button
              appearance="outline"
              variant="primary"
              disabled={submitting !== null}
              onClick={() => handleRespond("refuse")}
            >
              {submitting === "refuse" ? t("transfer.refusing") : t("transfer.refuse")}
            </Button>
          </>
        )}
        {!isLoading && loadFailed && (
          <Button
            appearance="outline"
            variant="primary"
            onClick={() => {
              if (details.transfer_recipient) onRetryTransfers(details.transfer_recipient.id);
              setRetryCount((count) => count + 1);
            }}
          >
            {t("transfer.retry")}
          </Button>
        )}
      </div>
    </div>
  );
}
