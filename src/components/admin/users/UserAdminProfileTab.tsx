"use client";

import React from "react";
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
      <h2 className="admin-page__section-title">EDITAR PERFIL</h2>

      {saveSuccess && (
        <StatusCard variant="success" showIcon description="Perfil guardado com sucesso." />
      )}
      {saveError && <StatusCard variant="danger" showIcon description={saveError} />}

      <div className="admin-page__fields-group">
        <div className="flex gap-[18px]">
          <div className="flex-1">
            <InputText
              label="Nome *"
              placeholder="Insira o nome aqui"
              id="first-name"
              value={firstName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onFirstNameChange(event.target.value)
              }
            />
          </div>
          <div className="flex-1">
            <InputText
              label="Último nome *"
              placeholder="Insira o último nome aqui"
              id="last-name"
              value={lastName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onLastNameChange(event.target.value)
              }
            />
          </div>
        </div>

        <InputTextArea
          label="Biografia"
          placeholder="Insira a descrição aqui"
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
              Perfil <span className="text-danger-600">*</span>
            </span>
            <div className="flex gap-24">
              {[
                { value: "admin", label: "Administrador" },
                { value: "editor", label: "Editor" },
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
          label="Site da Internet"
          placeholder="Insira o URL aqui"
          id="website"
          value={website}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onWebsiteChange(event.target.value)
          }
        />

        <div>
          <span className="text-primary-900 text-base font-medium leading-7">Foto de perfil</span>
          <div className="mt-2">
            <ButtonUploader
              label="Ficheiros"
              inputLabel="Selecione ou arraste o ficheiro"
              removeFileButtonLabel="Remover ficheiro"
              replaceFileButtonLabel="Substituir ficheiro"
              extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
              accept=".jpg,.jpeg,.png"
              maxSize={4194304}
              maxCount={1}
              onChange={onAvatarChange}
            />
          </div>
        </div>

        {userEmail && (
          <InputText
            label="Endereço de e-mail"
            placeholder="Insira o endereço de e-mail aqui"
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
          {isSaving ? "A guardar..." : "Guardar"}
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
