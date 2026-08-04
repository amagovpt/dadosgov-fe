"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  InputTextArea,
  StatusCard,
} from "@ama-pt/agora-design-system";
import type { HarvestSource } from "@/service/types/harvester";

interface ValidationPopupProps {
  harvester: HarvestSource;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
}

export function ApproveHarvesterPopupContent({
  harvester,
  onClose,
  onConfirm,
}: ValidationPopupProps) {
  const { t } = useTranslation(["admin-common", "admin-harvesters"]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(comment.trim());
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      setError(e?.data?.message || e?.message || t("admin-harvesters:validation.popup.approveError"));
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-[16px]">
      <p>
        {t("admin-harvesters:validation.popup.approveDescription", { name: harvester.name })}
      </p>
      <InputTextArea
        label={t("admin-harvesters:validation.popup.optionalComment")}
        value={comment}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setComment(e.target.value)
        }
        rows={3}
      />
      {error && <StatusCard variant="danger" showIcon description={error} />}
      <div className="flex justify-end gap-16 pt-16">
        <Button
          appearance="outline"
          variant="neutral"
          onClick={onClose}
          disabled={submitting}
        >
          {t("admin-common:actions.cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={submitting}
          hasIcon
          leadingIcon="agora-line-check-circle"
          leadingIconHover="agora-solid-check-circle"
        >
          {submitting ? t("admin-harvesters:actions.approving") : t("admin-harvesters:actions.approve")}
        </Button>
      </div>
    </div>
  );
}

export function RejectHarvesterPopupContent({
  harvester,
  onClose,
  onConfirm,
}: ValidationPopupProps) {
  const { t } = useTranslation(["admin-common", "admin-harvesters"]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = comment.trim();
  const isInvalid = trimmed.length === 0;

  const handleConfirm = async () => {
    if (isInvalid) {
      setError(t("admin-harvesters:validation.popup.rejectReasonRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      setError(e?.data?.message || e?.message || t("admin-harvesters:validation.popup.rejectError"));
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-[16px]">
      <p>
        {t("admin-harvesters:validation.popup.rejectDescription", { name: harvester.name })}
      </p>
      <InputTextArea
        label={t("admin-harvesters:validation.popup.rejectionReason")}
        value={comment}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setComment(e.target.value)
        }
        rows={4}
        required
      />
      {error && <StatusCard variant="danger" showIcon description={error} />}
      <div className="flex justify-end gap-16 pt-16">
        <Button
          appearance="outline"
          variant="neutral"
          onClick={onClose}
          disabled={submitting}
        >
          {t("admin-common:actions.cancel")}
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={submitting || isInvalid}
          hasIcon
          leadingIcon="agora-line-x-circle"
          leadingIconHover="agora-solid-x-circle"
        >
          {submitting ? t("admin-harvesters:actions.rejecting") : t("admin-harvesters:actions.reject")}
        </Button>
      </div>
    </div>
  );
}
