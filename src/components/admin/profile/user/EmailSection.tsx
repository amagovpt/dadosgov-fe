import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["admin-common", "admin-profile"]);

  return (
    <>
      {emailChangeSuccess && (
        <StatusCard
          variant="success"
          showIcon
          description={t("admin-profile:email.success", { email: pendingEmail })}
        />
      )}

      <div className="flex items-end gap-16">
        <div className="flex-1">
          {isEditingEmail ? (
            <InputText
              label={t("admin-profile:email.newEmailLabel")}
              placeholder={t("admin-profile:email.newEmailPlaceholder")}
              id="new-email"
              value={newEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNewEmailChange(e.target.value)}
            />
          ) : (
            <InputText
              label={t("admin-profile:email.emailLabel")}
              placeholder={t("admin-profile:email.emailPlaceholder")}
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
            {t("admin-profile:email.changeButton")}
          </Button>
        )}
      </div>

      {emailChangeSuccess && !isEditingEmail && (
        <p className="text-sm text-neutral-600">
          {t("admin-profile:email.pendingConfirmation", { email })}
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
            {isChangingEmail ? t("admin-profile:email.sending") : t("admin-profile:email.confirm")}
          </Button>
          <Button
            appearance="outline"
            variant="neutral"
            onClick={onCancel}
            disabled={isChangingEmail}
          >
            {t("admin-common:actions.cancel")}
          </Button>
        </div>
      )}
    </>
  );
}
