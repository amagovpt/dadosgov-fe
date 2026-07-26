"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, InputText, InputTextArea, StatusCard } from "@ama-pt/agora-design-system";
import ImageUploadField from "@/components/admin/forms/ImageUploadField";
import UserProfileAvatarDangerZone from "@/components/admin/profile/user/UserProfileAvatarDangerZone";
import type { AdminCard } from "@/service/types/admin/common";
import type { ApiToken } from "@/service/types/identity";

interface UserProfileMainTabProps {
  firstName: string;
  lastName: string;
  about: string;
  website: string;
  avatarError: string | null;
  avatarUploaderKey: number;
  newTokenName: string;
  isGeneratingKey: boolean;
  newToken: string | null;
  tokenCopied: boolean;
  apiTokens: ApiToken[];
  revokingTokenId: string | null;
  email: string;
  isEditingEmail: boolean;
  newEmail: string;
  pendingEmail: string;
  emailChangeSuccess: boolean;
  isChangingEmail: boolean;
  samlLogin: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string;
  isDeletingAvatar: boolean;
  hasAvatar: boolean;
  deleteAvatarCard?: AdminCard;
  onFirstNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLastNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAboutChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onWebsiteChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarSecurityError: () => void;
  onNewTokenNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateApiKey: () => void;
  onCopyToken: () => void;
  onRevokeToken: (tokenId: string) => void;
  onStartEmailEdit: () => void;
  onNewEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmEmailChange: () => void;
  onCancelEmailEdit: () => void;
  onChangePassword: () => void;
  onSave: () => void;
  onDeleteAvatar: () => void;
  formatTokenCreatedAt: (value: string) => string;
  formatLastUsedAt: (value: string | null) => string;
}

export default function UserProfileMainTab({
  firstName,
  lastName,
  about,
  website,
  avatarError,
  avatarUploaderKey,
  newTokenName,
  isGeneratingKey,
  newToken,
  tokenCopied,
  apiTokens,
  revokingTokenId,
  email,
  isEditingEmail,
  newEmail,
  pendingEmail,
  emailChangeSuccess,
  isChangingEmail,
  samlLogin,
  isSaving,
  saveSuccess,
  saveError,
  isDeletingAvatar,
  hasAvatar,
  deleteAvatarCard,
  onFirstNameChange,
  onLastNameChange,
  onAboutChange,
  onWebsiteChange,
  onAvatarChange,
  onAvatarSecurityError,
  onNewTokenNameChange,
  onGenerateApiKey,
  onCopyToken,
  onRevokeToken,
  onStartEmailEdit,
  onNewEmailChange,
  onConfirmEmailChange,
  onCancelEmailEdit,
  onChangePassword,
  onSave,
  onDeleteAvatar,
  formatTokenCreatedAt,
  formatLastUsedAt,
}: UserProfileMainTabProps) {
  const { t } = useTranslation(["admin-profile", "admin-common"]);

  return (
    <div
      className="admin-page__form mt-24"
      style={{
        maxWidth: "calc(100% - var(--admin-auxiliar-width) - var(--admin-auxiliar-gap))",
      }}
    >
      <h2 className="admin-page__section-title">{t("admin-profile:form.sectionTitle")}</h2>

      {saveSuccess && (
        <StatusCard
          variant="success"
          showIcon
          description={t("admin-profile:form.saveSuccess")}
        />
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
              onChange={onFirstNameChange}
            />
          </div>
          <div className="flex-1">
            <InputText
              label={t("admin-profile:form.lastNameLabel")}
              placeholder={t("admin-profile:form.lastNamePlaceholder")}
              id="last-name"
              value={lastName}
              onChange={onLastNameChange}
            />
          </div>
        </div>

        <InputTextArea
          label={t("admin-profile:form.biographyLabel")}
          placeholder={t("admin-profile:form.biographyPlaceholder")}
          id="biography"
          rows={4}
          value={about}
          onChange={onAboutChange}
        />

        <InputText
          label={t("admin-profile:form.websiteLabel")}
          placeholder={t("admin-profile:form.websitePlaceholder")}
          id="website"
          value={website}
          onChange={onWebsiteChange}
        />

        <ImageUploadField
          key={avatarUploaderKey}
          label={t("admin-profile:avatar.label")}
          uploaderLabel={t("admin-profile:avatar.filesLabel")}
          dragAndDropLabel={t("admin-profile:avatar.dragAndDropLabel")}
          inputLabel={t("admin-profile:avatar.inputLabel")}
          extensionsInstructions={t("admin-profile:avatar.extensionsInstructions")}
          maxSizeExceededErrorLabel={t("admin-profile:avatar.maxSizeExceededErrorLabel")}
          forbiddenExtensionErrorLabel={t("admin-profile:avatar.forbiddenExtensionErrorLabel")}
          onChange={onAvatarChange}
          onSecurityError={onAvatarSecurityError}
          error={avatarError}
        />

        <div className="flex flex-col gap-16">
          <div>
            <p className="mb-8 text-base font-medium text-neutral-900">
              {t("admin-profile:apiKeys.title")}
            </p>
            <p className="mb-16 text-sm text-neutral-700">
              {t("admin-profile:apiKeys.description")}
            </p>
          </div>

          <div className="flex items-end gap-16">
            <div className="flex-1">
              <InputText
                label={t("admin-profile:apiKeys.newKeyNameLabel")}
                placeholder={t("admin-profile:apiKeys.newKeyNamePlaceholder")}
                id="new-token-name"
                value={newTokenName}
                onChange={onNewTokenNameChange}
              />
            </div>
            <Button
              appearance="outline"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-edit"
              leadingIconHover="agora-solid-edit"
              onClick={onGenerateApiKey}
              disabled={isGeneratingKey}
            >
              {isGeneratingKey
                ? t("admin-profile:apiKeys.generating")
                : t("admin-profile:apiKeys.generate")}
            </Button>
          </div>

          {newToken && (
            <StatusCard
              variant="warning"
              showIcon
              description={
                <div className="flex flex-col gap-8">
                  <p>
                    <strong>{t("admin-profile:apiKeys.copyNowTitle")}</strong>{" "}
                    {t("admin-profile:apiKeys.copyNowDescription")}
                  </p>
                  <div className="flex items-center gap-8">
                    <code className="text-xs flex-1 break-all rounded-4 border border-neutral-300 bg-neutral-50 px-12 py-8">
                      {newToken}
                    </code>
                    <Button
                      appearance="outline"
                      variant="primary"
                      hasIcon
                      leadingIcon={tokenCopied ? "agora-line-check" : "agora-line-copy"}
                      leadingIconHover={tokenCopied ? "agora-solid-check" : "agora-solid-copy"}
                      onClick={onCopyToken}
                    >
                      {tokenCopied
                        ? t("admin-profile:apiKeys.copied")
                        : t("admin-profile:apiKeys.copy")}
                    </Button>
                  </div>
                </div>
              }
            />
          )}

          {apiTokens.length > 0 ? (
            <div className="flex flex-col gap-8">
              <p className="text-sm font-medium text-neutral-900">
                {t("admin-profile:apiKeys.activeKeys", { count: apiTokens.length })}
              </p>
              <div className="flex flex-col divide-y divide-neutral-200 rounded-4 border border-neutral-200">
                {apiTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between gap-16 px-16 py-12"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-8">
                        <code className="text-sm font-mono text-neutral-900">
                          {token.token_prefix}...
                        </code>
                        {token.name && (
                          <span className="text-sm text-neutral-700">{token.name}</span>
                        )}
                      </div>
                      <p className="mt-4 text-xs text-neutral-700">
                        {t("admin-profile:apiKeys.createdAt", {
                          date: formatTokenCreatedAt(token.created_at),
                        })}
                        {" - "}
                        {t("admin-profile:apiKeys.lastUsed", {
                          value: formatLastUsedAt(token.last_used_at),
                        })}
                      </p>
                    </div>
                    <Button
                      appearance="outline"
                      variant="danger"
                      hasIcon
                      leadingIcon="agora-line-trash"
                      leadingIconHover="agora-solid-trash"
                      onClick={() => onRevokeToken(token.id)}
                      disabled={revokingTokenId === token.id}
                    >
                      {revokingTokenId === token.id
                        ? t("admin-profile:apiKeys.revoking")
                        : t("admin-profile:apiKeys.revoke")}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-neutral-700">{t("admin-profile:apiKeys.empty")}</p>
          )}
        </div>

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
                onChange={onNewEmailChange}
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
              onClick={onStartEmailEdit}
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
              onClick={onConfirmEmailChange}
              disabled={
                isChangingEmail || !newEmail || newEmail === email || newEmail === pendingEmail
              }
            >
              {isChangingEmail
                ? t("admin-profile:email.sending")
                : t("admin-profile:email.confirm")}
            </Button>
            <Button
              appearance="outline"
              variant="neutral"
              onClick={onCancelEmailEdit}
              disabled={isChangingEmail}
            >
              {t("admin-common:actions.cancel")}
            </Button>
          </div>
        )}

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
              onClick={onChangePassword}
            >
              {t("admin-profile:form.changePasswordButton")}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-16 flex justify-end">
        <Button
          variant="primary"
          hasIcon
          leadingIcon="agora-line-check-circle"
          leadingIconHover="agora-solid-check-circle"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? t("admin-common:actions.saving") : t("admin-common:actions.save")}
        </Button>
      </div>

      {hasAvatar && (
        <UserProfileAvatarDangerZone
          isDeletingAvatar={isDeletingAvatar}
          deleteAvatarCard={deleteAvatarCard}
          onDeleteAvatar={onDeleteAvatar}
        />
      )}
    </div>
  );
}
