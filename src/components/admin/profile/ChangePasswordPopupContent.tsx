"use client";

import { useState } from "react";
import { Button, InputText, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import { fetchCsrfToken } from "@/app/api/auth";
import { changePassword } from "@/app/api/profile";

export function ChangePasswordPopupContent() {
  const { hide } = usePopupContext();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validate = () => {
    const newErrors = {
      currentPassword: !currentPassword ? "Campo obrigatório" : "",
      newPassword: !newPassword ? "Campo obrigatório" : "",
      confirmPassword: !confirmPassword
        ? "Campo obrigatório"
        : newPassword && confirmPassword && newPassword !== confirmPassword
          ? "As senhas não coincidem"
          : "",
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    setError("");
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const csrfToken = await fetchCsrfToken();
      await changePassword(currentPassword, newPassword, confirmPassword, csrfToken);
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
    <div className="flex flex-col gap-24">
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
            hasError={!!errors.currentPassword}
            errorFeedbackText={errors.currentPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCurrentPassword(e.target.value)
            }
          />

          <InputText
            label="Nova Senha *"
            placeholder=""
            id="new-password"
            type="password"
            value={newPassword}
            hasError={!!errors.newPassword}
            errorFeedbackText={errors.newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewPassword(e.target.value)
            }
          />

          <InputText
            label="Confirme a nova senha *"
            placeholder=""
            id="confirm-password"
            type="password"
            value={confirmPassword}
            hasError={!!errors.confirmPassword}
            errorFeedbackText={errors.confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(e.target.value)
            }
          />

          <div className="flex gap-16">
            <Button appearance="outline" variant="neutral" onClick={() => hide()}>
              Cancelar
            </Button>
            <Button
              appearance="solid"
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "A alterar..." : "Altere a sua senha"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
