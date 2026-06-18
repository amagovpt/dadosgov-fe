import { Button, InputText, StatusCard } from "@ama-pt/agora-design-system";

interface EmailSectionProps {
  email: string;
  pendingEmail: string;
  newEmail: string;
  isEditingEmail: boolean;
  isChangingEmail: boolean;
  emailChangeSuccess: boolean;
  samlLogin: boolean;
  onStartEdit: () => void;
  onNewEmailChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EmailSection({
  email,
  pendingEmail,
  newEmail,
  isEditingEmail,
  isChangingEmail,
  emailChangeSuccess,
  samlLogin,
  onStartEdit,
  onNewEmailChange,
  onConfirm,
  onCancel,
}: EmailSectionProps) {
  return (
    <>
      {emailChangeSuccess && (
        <StatusCard
          variant="success"
          showIcon
          description={`E-mail de confirmação enviado para ${pendingEmail}. Verifique a sua caixa de entrada e clique no link para concluir.`}
        />
      )}

      <div className="flex items-end gap-16">
        <div className="flex-1">
          {isEditingEmail ? (
            <InputText
              label="Novo endereço de e-mail"
              placeholder="Insira o novo e-mail aqui"
              id="new-email"
              value={newEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNewEmailChange(e.target.value)}
            />
          ) : (
            <InputText
              label="Endereço de e-mail"
              placeholder="Insira o e-mail aqui"
              id="email"
              value={emailChangeSuccess ? pendingEmail : email}
              readOnly
            />
          )}
        </div>
        {!samlLogin && !isEditingEmail && (
          <Button
            appearance="outline"
            variant="neutral"
            hasIcon
            leadingIcon="agora-line-edit"
            leadingIconHover="agora-solid-edit"
            onClick={onStartEdit}
          >
            Alterar e-mail
          </Button>
        )}
      </div>

      {emailChangeSuccess && !isEditingEmail && (
        <p className="text-sm text-neutral-600">
          Aguarda confirmação por e-mail — até confirmar, o e-mail ativo é{" "}
          <strong>{email}</strong>
        </p>
      )}

      {!samlLogin && isEditingEmail && (
        <div className="flex justify-end gap-8">
          <Button
            appearance="outline"
            variant="primary"
            onClick={onConfirm}
            disabled={
              isChangingEmail || !newEmail || newEmail === email || newEmail === pendingEmail
            }
          >
            {isChangingEmail ? "A enviar..." : "Confirmar"}
          </Button>
          <Button
            appearance="outline"
            variant="neutral"
            onClick={onCancel}
            disabled={isChangingEmail}
          >
            Cancelar
          </Button>
        </div>
      )}
    </>
  );
}
