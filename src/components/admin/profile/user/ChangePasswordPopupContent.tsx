"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, InputText, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import { changePassword } from "@/service/api/profile";
import { useFormErrors } from "@/hooks/forms/useFormErrors";

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export function ChangePasswordPopupContent() {
  const { t } = useTranslation(["admin-common", "admin-profile"]);
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
      currentPassword: !currentPassword ? t("admin-profile:changePassword.requiredField") : "",
      newPassword: !newPassword ? t("admin-profile:changePassword.requiredField") : "",
      confirmPassword: !confirmPassword
        ? t("admin-profile:changePassword.requiredField")
        : newPassword && confirmPassword && newPassword !== confirmPassword
          ? t("admin-profile:changePassword.passwordMismatch")
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
        err instanceof Error ? err.message : t("admin-profile:changePassword.error")
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
        <StatusCard variant="success" showIcon description={t("admin-profile:changePassword.success")} />
      ) : (
        <>
          {error && <StatusCard variant="danger" showIcon description={error} />}

          <InputText
            label={t("admin-profile:changePassword.currentPasswordLabel")}
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
            label={t("admin-profile:changePassword.newPasswordLabel")}
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
            label={t("admin-profile:changePassword.confirmPasswordLabel")}
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
              {t("admin-common:actions.cancel")}
            </Button>
            <Button
              type="submit"
              appearance="solid"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("admin-profile:changePassword.submitting") : t("admin-profile:changePassword.submit")}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
