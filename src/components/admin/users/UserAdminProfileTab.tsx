"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonUploader,
  InputText,
  InputTextArea,
  StatusCard,
} from "@ama-pt/agora-design-system";
import UserAdminProfileDangerZone from "@/components/admin/users/UserAdminProfileDangerZone";

type UserAdminProfileTabProps = {
  isAdmin: boolean;
  firstName: string;
  lastName: string;
  about: string;
  website: string;
  role: string;
  userEmail: string;
  userActive: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  saveSuccess: boolean;
  saveError: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onAboutChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onToggleActive: (event: React.MouseEvent) => void;
  onOpenDeletePopup: (event: React.MouseEvent) => void;
};

export default function UserAdminProfileTab({
  isAdmin,
  firstName,
  lastName,
  about,
  website,
  role,
  userEmail,
  userActive,
  isSaving,
  isDeleting,
  saveSuccess,
  saveError,
  onFirstNameChange,
  onLastNameChange,
  onAboutChange,
  onWebsiteChange,
  onRoleChange,
  onAvatarChange,
  onSave,
  onToggleActive,
  onOpenDeletePopup,
}: UserAdminProfileTabProps) {
  const { t } = useTranslation(["admin-common", "admin-users"]);

  return (
    <form
      className="admin-page__form mt-24"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      style={{
        maxWidth: "calc(100% - var(--admin-auxiliar-width) - var(--admin-auxiliar-gap))",
      }}
    >
      <h2 className="admin-page__section-title">{t("admin-users:profileTab.sectionTitle")}</h2>

      {saveSuccess && (
        <StatusCard
          variant="success"
          showIcon
          description={t("admin-users:profileTab.saveSuccess")}
        />
      )}
      {saveError && <StatusCard variant="danger" showIcon description={saveError} />}

      <div className="admin-page__fields-group">
        <div className="flex gap-[18px]">
          <div className="flex-1">
            <InputText
              label={t("admin-users:profileTab.firstNameLabel")}
              placeholder={t("admin-users:profileTab.firstNamePlaceholder")}
              id="first-name"
              value={firstName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onFirstNameChange(event.target.value)
              }
            />
          </div>
          <div className="flex-1">
            <InputText
              label={t("admin-users:profileTab.lastNameLabel")}
              placeholder={t("admin-users:profileTab.lastNamePlaceholder")}
              id="last-name"
              value={lastName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onLastNameChange(event.target.value)
              }
            />
          </div>
        </div>

        <InputTextArea
          label={t("admin-users:profileTab.biographyLabel")}
          placeholder={t("admin-users:profileTab.biographyPlaceholder")}
          id="biography"
          rows={4}
          value={about}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            onAboutChange(event.target.value)
          }
        />

        {isAdmin && (
          <div className="flex flex-col gap-12">
            <span className="text-primary-900 text-base font-medium leading-7">
              {t("admin-users:profileTab.roleLabel")} <span className="text-danger-600">*</span>
            </span>
            <div className="flex gap-24">
              {[
                { value: "admin", label: t("admin-users:profileTab.roleAdmin") },
                { value: "editor", label: t("admin-users:profileTab.roleEditor") },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={role === value}
                  onClick={() => onRoleChange(value)}
                  className="flex min-h-[44px] cursor-pointer items-start gap-8 border-0 bg-transparent p-0"
                >
                  <div className="p-[10px]">
                    <div
                      className={`flex min-h-24 min-w-24 items-center justify-center rounded-full ${
                        role === value
                          ? "border-6 border-primary-600 bg-primary-600"
                          : "border-2 border-neutral-900"
                      }`}
                    >
                      {role === value && <span className="block h-12 w-12 rounded-full bg-white" />}
                    </div>
                  </div>
                  <span
                    className={`pt-[10px] text-base leading-7 ${
                      role === value ? "text-primary-600" : "text-neutral-900"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <InputText
          label={t("admin-users:profileTab.websiteLabel")}
          placeholder={t("admin-users:profileTab.websitePlaceholder")}
          id="website"
          value={website}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onWebsiteChange(event.target.value)
          }
        />

        <div>
          <span className="text-primary-900 text-base font-medium leading-7">
            {t("admin-users:profileTab.avatarLabel")}
          </span>
          <div className="mt-2">
            <ButtonUploader
              label={t("admin-users:profileTab.avatarUploaderLabel")}
              inputLabel={t("admin-users:profileTab.avatarInputLabel")}
              removeFileButtonLabel={t("admin-users:profileTab.avatarRemoveFileButtonLabel")}
              replaceFileButtonLabel={t("admin-users:profileTab.avatarReplaceFileButtonLabel")}
              extensionsInstructions={t("admin-users:profileTab.avatarExtensionsInstructions")}
              accept=".jpg,.jpeg,.png"
              maxSize={4194304}
              maxCount={1}
              onChange={onAvatarChange}
            />
          </div>
        </div>

        {userEmail && (
          <InputText
            label={t("admin-users:profileTab.emailLabel")}
            placeholder={t("admin-users:profileTab.emailPlaceholder")}
            id="email"
            value={userEmail}
            readOnly
          />
        )}
      </div>

      <div className="mt-16 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          hasIcon
          leadingIcon="agora-line-check-circle"
          leadingIconHover="agora-solid-check-circle"
          disabled={isSaving}
        >
          {isSaving ? t("admin-users:profileTab.saveLoading") : t("admin-common:actions.save")}
        </Button>
      </div>

      {isAdmin && (
        <UserAdminProfileDangerZone
          userActive={userActive}
          isDeleting={isDeleting}
          onToggleActive={onToggleActive}
          onOpenDeletePopup={onOpenDeletePopup}
        />
      )}
    </form>
  );
}
