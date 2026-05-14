import React, { useState } from "react";
import Link from "next/link";
import { Button, Icon, InputTextArea } from "@ama-pt/agora-design-system";
import RecipientSelect, {
  type RecipientSelection,
} from "@/components/admin/RecipientSelect";

type ReusesEditTransferPopupProps = {
  reuseTitle: string;
  onConfirm: (recipient: RecipientSelection, comment: string) => Promise<void>;
};

export default function ReusesEditTransferPopup({
  reuseTitle,
  onConfirm,
}: ReusesEditTransferPopupProps) {
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
      // Parent is responsible for hide() on success.
    } catch (error) {
      const msg = error instanceof Error ? error.message : null;
      setErrorMessage(msg || "Erro ao pedir a transferência da reutilização.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-16">
      <p>
        <Icon name="agora-line-document" className="inline w-4 h-4 mr-4" />
        <span className="text-primary-600">{reuseTitle}</span>
      </p>
      <p>
        <strong>Esta ação é irreversível.</strong>&nbsp;
        Poderá deixar de conseguir gerir esta reutilização.
      </p>

      <div className="flex flex-col gap-8">
        <label className="text-primary-900 text-base font-medium leading-7">
          Organização ou utilizador <span className="text-danger-600">*</span>
        </label>
        <RecipientSelect
          id="transfer-reuse-recipient"
          placeholder="Selecione a identidade para a qual pretende transferir a reutilização..."
          onChange={(selection) => {
            setRecipient(selection);
            if (selection) setShowRecipientError(false);
          }}
          hasError={showRecipientError}
          errorFeedbackText="Selecione um utilizador ou organização"
        />
        {recipient && (
          <p className="text-sm text-neutral-700">
            Destinatário selecionado:{" "}
            <strong className="text-primary-900">{recipient.label}</strong>{" "}
            <span className="text-neutral-500">
              ({recipient.class === "User" ? "utilizador" : "organização"})
            </span>
          </p>
        )}
      </div>

      <div className="admin-page__org-card flex flex-col items-center gap-16 bg-neutral-50 rounded-lg p-8 text-center">
        <h3 className="text-primary-900 text-lg font-bold leading-7">
          Não pertence a uma organização.
        </h3>
        <p className="text-neutral-700 text-base leading-7">
          Quando a reutilização for produzida no contexto de atividade profissional, é
          recomendável que seja publicada em nome da organização responsável.
        </p>
        <Link
          href="/pages/admin/organizations"
          className="inline-flex items-center text-primary-500 text-base hover:underline"
        >
          <span className="mr-[5px]">Crie ou integre uma organização em dados.gov.pt</span>
          <Icon name="agora-line-arrow-right-circle" className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex flex-col gap-8">
        <label className="text-primary-900 text-base font-medium leading-7">
          Comentário
        </label>
        <InputTextArea
          placeholder="Mensagem opcional para o destinatário..."
          id="transfer-reuse-comment"
          label=""
          rows={3}
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setComment(e.target.value)
          }
        />
      </div>

      {errorMessage && (
        <p className="text-danger-600 text-sm">{errorMessage}</p>
      )}

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
          {isSubmitting ? "A transferir..." : "Transferir a reutilização"}
        </Button>
      </div>
    </div>
  );
}
