"use client";

import { useState } from "react";
import {
  Button,
  InputTextArea,
  StatusCard,
} from "@ama-pt/agora-design-system";
import type { HarvestSource } from "@/types/api";

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
      setError(e?.data?.message || e?.message || "Falha ao aprovar o harvester.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-[16px]">
      <p>
        Pretende aprovar o harvester &quot;{harvester.name}&quot;? O proprietário
        será notificado.
      </p>
      <InputTextArea
        label="Comentário (opcional)"
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
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={submitting}
          hasIcon
          leadingIcon="agora-line-check-circle"
          leadingIconHover="agora-solid-check-circle"
        >
          {submitting ? "A aprovar..." : "Aprovar"}
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
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = comment.trim();
  const isInvalid = trimmed.length === 0;

  const handleConfirm = async () => {
    if (isInvalid) {
      setError("É obrigatório indicar o motivo da rejeição.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      setError(e?.data?.message || e?.message || "Falha ao rejeitar o harvester.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-[16px]">
      <p>
        Pretende rejeitar o harvester &quot;{harvester.name}&quot;? O motivo abaixo
        será comunicado ao proprietário.
      </p>
      <InputTextArea
        label="Motivo da rejeição"
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
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={submitting || isInvalid}
          hasIcon
          leadingIcon="agora-line-x-circle"
          leadingIconHover="agora-solid-x-circle"
        >
          {submitting ? "A rejeitar..." : "Rejeitar"}
        </Button>
      </div>
    </div>
  );
}
