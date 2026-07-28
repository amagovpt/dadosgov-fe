"use client";

import { useTranslation } from "react-i18next";
import { Button, InputText, InputTextArea, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import { ApiToken, UserPublic } from "@/service/types/identity";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { AvatarSection } from "./AvatarSection";
import { ApiKeysSection } from "./ApiKeysSection";
import { EmailSection } from "./EmailSection";
import { ChangePasswordPopupContent } from "./ChangePasswordPopupContent";
import { DeleteAvatarPopupContent } from "./DeleteAvatarPopupContent";

interface ProfileFormTabProps {
  profile: UserPublic | null;
  firstName: string;
  lastName: string;
  about: string;
  website: string;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string;
  samlLogin: boolean;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onAboutChange: (v: string) => void;
  onWebsiteChange: (v: string) => void;
  onSave: () => void;
  avatarError: string | null;
  avatarUploaderKey: number;
  isDeletingAvatar: boolean;
  deleteAvatarCard?: AdminCard;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAvatar: () => Promise<void>;
  onAvatarSecurityError: () => void;
  apiTokens: ApiToken[];
  newToken: string | null;
  newTokenName: string;
  tokenCopied: boolean;
  isGeneratingKey: boolean;
  revokingTokenId: string | null;
  onTokenNameChange: (name: string) => void;
  onGenerateApiKey: () => void;
  onCopyToken: () => void;
  onRevokeToken: (tokenId: string) => void;
  email: string;
  pendingEmail: string;
  newEmail: string;
  isEditingEmail: boolean;
  isChangingEmail: boolean;
  emailChangeSuccess: boolean;
  onStartEditEmail: () => void;
  onNewEmailChange: (value: string) => void;
  onConfirmEmailChange: () => void;
  onCancelEmailChange: () => void;
}

export function ProfileFormTab({
  profile,
  firstName,
  lastName,
  about,
  website,
  isSaving,
  saveSuccess,
  saveError,
  samlLogin,
  onFirstNameChange,
  onLastNameChange,
  onAboutChange,
  onWebsiteChange,
  onSave,
  avatarError,
  avatarUploaderKey,
  isDeletingAvatar,
  deleteAvatarCard,
  onAvatarChange,
  onDeleteAvatar,
  onAvatarSecurityError,
  apiTokens,
  newToken,
  newTokenName,
  tokenCopied,
  isGeneratingKey,
  revokingTokenId,
  onTokenNameChange,
  onGenerateApiKey,
  onCopyToken,
  onRevokeToken,
  email,
  pendingEmail,
  newEmail,
  isEditingEmail,
  isChangingEmail,
  emailChangeSuccess,
  onStartEditEmail,
  onNewEmailChange,
  onConfirmEmailChange,
  onCancelEmailChange,
}: ProfileFormTabProps) {
  const { t } = useTranslation(["admin-common", "admin-profile"]);
  const { show } = usePopupContext();

  return (
    <div
      className="admin-page__form mt-24"
      style={{
        maxWidth: "calc(100% - var(--admin-auxiliar-width) - var(--admin-auxiliar-gap))",
      }}
    >
      <h2 className="admin-page__section-title">{t("admin-profile:form.sectionTitle")}</h2>

      {saveSuccess && (
        <StatusCard variant="success" showIcon description={t("admin-profile:form.saveSuccess")} />
      )}
      {saveError && <StatusCard variant="danger" showIcon description={saveError} />}

      <div className="admin-page__fields-group">
        <div className="flex gap-[18px]">
          <div className="flex-1">
            <InputText
              label={t("admin-profile:form.firstNameLabel")}
              placeholder={t("admin-profile:form.firstNamePlaceholder")}
              id="first-name"
              value={firstName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onFirstNameChange(e.target.value)
              }
            />
          </div>
          <div className="flex-1">
            <InputText
              label={t("admin-profile:form.lastNameLabel")}
              placeholder={t("admin-profile:form.lastNamePlaceholder")}
              id="last-name"
              value={lastName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onLastNameChange(e.target.value)
              }
            />
          </div>
        </div>

        <InputTextArea
          label={t("admin-profile:form.biographyLabel")}
          placeholder={t("admin-profile:form.biographyPlaceholder")}
          id="biography"
          rows={4}
          value={about}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onAboutChange(e.target.value)}
        />

        <InputText
          label={t("admin-profile:form.websiteLabel")}
          placeholder={t("admin-profile:form.websitePlaceholder")}
          id="website"
          value={website}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onWebsiteChange(e.target.value)}
        />

        <AvatarSection
          avatarError={avatarError}
          avatarUploaderKey={avatarUploaderKey}
          onAvatarChange={onAvatarChange}
          onSecurityError={onAvatarSecurityError}
        />

        <ApiKeysSection
          apiTokens={apiTokens}
          newToken={newToken}
          newTokenName={newTokenName}
          tokenCopied={tokenCopied}
          isGeneratingKey={isGeneratingKey}
          revokingTokenId={revokingTokenId}
          onNameChange={onTokenNameChange}
          onGenerate={onGenerateApiKey}
          onCopy={onCopyToken}
          onRevoke={onRevokeToken}
        />

        <EmailSection
          email={email}
          pendingEmail={pendingEmail}
          newEmail={newEmail}
          isEditingEmail={isEditingEmail}
          isChangingEmail={isChangingEmail}
          emailChangeSuccess={emailChangeSuccess}
          samlLogin={samlLogin}
          onStartEdit={onStartEditEmail}
          onNewEmailChange={onNewEmailChange}
          onConfirm={onConfirmEmailChange}
          onCancel={onCancelEmailChange}
        />

        <div className="flex items-end gap-16">
          <div className="flex-1">
            <InputText
              label={t("admin-profile:form.passwordLabel")}
              placeholder="........"
              id="password"
              type="password"
              readOnly
            />
          </div>
          {!samlLogin && (
            <Button
              appearance="outline"
              variant="neutral"
              hasIcon
              leadingIcon="agora-line-edit"
              leadingIconHover="agora-solid-edit"
              onClick={() =>
                show(<ChangePasswordPopupContent />, {
                  title: t("admin-profile:form.changePasswordTitle"),
                  closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
                  dimensions: "m",
                })
              }
            >
              {t("admin-profile:form.changePasswordButton")}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-16 flex justify-end">
        <Button
          variant="primary"
          hasIcon={true}
          leadingIcon="agora-line-check-circle"
          leadingIconHover="agora-solid-check-circle"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? t("admin-common:actions.saving") : t("admin-common:actions.save")}
        </Button>
      </div>

      {profile?.avatar_thumbnail && (
        <div style={{ marginTop: 16 }}>
          <AdminDangerActions
            actions={[
              {
                variant: "danger",
                heading: deleteAvatarCard?.title,
                description: formatHtmlParagraphs(deleteAvatarCard?.description),
                actionLabel: isDeletingAvatar
                  ? t("admin-profile:form.deleteAvatarLoading")
                  : deleteAvatarCard?.anchor?.children,
                onAction: () =>
                  show(<DeleteAvatarPopupContent onConfirm={onDeleteAvatar} />, {
                    title: t("admin-profile:form.deleteAvatarTitle"),
                    closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
                    dimensions: "s",
                  }),
              },
            ]}
            disabled={isDeletingAvatar}
          />
        </div>
      )}
    </div>
  );
}
