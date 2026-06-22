"use client";

import { useState } from "react";
import { Button, InputText, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import { changePassword } from "@/service/api/profile";
import { useFormErrors } from "@/hooks/forms/useFormErrors";

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export function ChangePasswordPopupContent() {
  const { hide } = usePopupContext();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { hasError, getErrorMessage, setErrors, clearError, focusFirstError } =
    useFormErrors<PasswordField>();

  const validate = () => {
    const newErrors: Partial<Record<PasswordField, string>> = {
      currentPassword: !currentPassword ? "Campo obrigatório" : "",
      newPassword: !newPassword ? "Campo obrigatório" : "",
      confirmPassword: !confirmPassword
        ? "Campo obrigatório"
        : newPassword && confirmPassword && newPassword !== confirmPassword
          ? "As senhas não coincidem"
          : "",
    };
    setErrors(newErrors);
    const isValid = !Object.values(newErrors).some(Boolean);
    if (!isValid) focusFirstError();
    return isValid;
  };

  const handleSubmit = async () => {
    setError("");
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(true);
      setTimeout(() => hide(), 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao alterar a senha. Verifique os dados e tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-24"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      {success ? (
        <StatusCard variant="success" showIcon description="Senha alterada com sucesso." />
      ) : (
        <>
          {error && <StatusCard variant="danger" showIcon description={error} />}

          <InputText
            label="Senha atual *"
            placeholder=""
            id="current-password"
            type="password"
            value={currentPassword}
            hasError={hasError("currentPassword")}
            errorFeedbackText={getErrorMessage("currentPassword")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setCurrentPassword(e.target.value);
              clearError("currentPassword");
            }}
          />

          <InputText
            label="Nova Senha *"
            placeholder=""
            id="new-password"
            type="password"
            value={newPassword}
            hasError={hasError("newPassword")}
            errorFeedbackText={getErrorMessage("newPassword")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setNewPassword(e.target.value);
              clearError("newPassword");
            }}
          />

          <InputText
            label="Confirme a nova senha *"
            placeholder=""
            id="confirm-password"
            type="password"
            value={confirmPassword}
            hasError={hasError("confirmPassword")}
            errorFeedbackText={getErrorMessage("confirmPassword")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setConfirmPassword(e.target.value);
              clearError("confirmPassword");
            }}
          />

          <div className="flex gap-16">
            <Button type="button" appearance="outline" variant="neutral" onClick={() => hide()}>
              Cancelar
            </Button>
            <Button
              type="submit"
              appearance="solid"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "A alterar..." : "Altere a sua senha"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
