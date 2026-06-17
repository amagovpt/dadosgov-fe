"use client";

import React from "react";
import { Button, InputText, InputTextArea, StatusCard } from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
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
  return (
    <div
      className="admin-page__form mt-24"
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
              onChange={onFirstNameChange}
            />
          </div>
          <div className="flex-1">
            <InputText
              label="Último nome *"
              placeholder="Insira o apelido aqui"
              id="last-name"
              value={lastName}
              onChange={onLastNameChange}
            />
          </div>
        </div>

        <InputTextArea
          label="Biografia"
          placeholder="Insira a descrição aqui"
          id="biography"
          rows={4}
          value={about}
          onChange={onAboutChange}
        />

        <InputText
          label="Site da Internet"
          placeholder="Insira o URL aqui"
          id="website"
          value={website}
          onChange={onWebsiteChange}
        />

        <div>
          <span className="text-base font-medium leading-7 text-primary-900">Foto de perfil</span>
          <div className="mt-2 [&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
            <DragAndDropUploader
              key={avatarUploaderKey}
              label="Ficheiros"
              dragAndDropLabel="Arraste e largue o ficheiro aqui"
              inputLabel="Selecione ou arraste o ficheiro"
              selectedFilesLabel="ficheiro selecionado"
              removeFileButtonLabel="Remover ficheiro"
              replaceFileButtonLabel="Substituir ficheiro"
              extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
              accept=".jpg,.jpeg,.png"
              maxSize={4194304}
              maxCount={1}
              maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 4 MB."
              forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
              hasError={!!avatarError}
              hasFeedback={!!avatarError}
              feedbackState="danger"
              feedbackText={avatarError ?? undefined}
              onChange={onAvatarChange}
              onSecurityError={onAvatarSecurityError}
            />
          </div>
        </div>

        <div className="flex flex-col gap-16">
          <div>
            <p className="mb-8 text-base font-medium text-neutral-900">Chaves da API</p>
            <p className="mb-16 text-sm text-neutral-700">
              Gere uma chave para autenticar pedidos à API. Por motivos de segurança, a chave
              completa só é apresentada uma vez no momento da criação — guarde-a num local seguro.
            </p>
          </div>

          <div className="flex items-end gap-16">
            <div className="flex-1">
              <InputText
                label="Nome da nova chave (opcional)"
                placeholder="Ex.: Script backup, Integração X..."
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
              {isGeneratingKey ? "A gerar..." : "Gerar nova chave"}
            </Button>
          </div>

          {newToken && (
            <StatusCard
              variant="warning"
              showIcon
              description={
                <div className="flex flex-col gap-8">
                  <p>
                    <strong>Copie esta chave agora.</strong> Não voltará a ser apresentada.
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
                      {tokenCopied ? "Copiado" : "Copiar"}
                    </Button>
                  </div>
                </div>
              }
            />
          )}

          {apiTokens.length > 0 ? (
            <div className="flex flex-col gap-8">
              <p className="text-sm font-medium text-neutral-900">
                Chaves activas ({apiTokens.length})
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
                          {token.token_prefix}…
                        </code>
                        {token.name && (
                          <span className="text-sm text-neutral-700">— {token.name}</span>
                        )}
                      </div>
                      <p className="mt-4 text-xs text-neutral-700">
                        Criada em {formatTokenCreatedAt(token.created_at)}
                        {formatLastUsedAt(token.last_used_at)}
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
                      {revokingTokenId === token.id ? "A revogar..." : "Revogar"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-neutral-700">Ainda não tem chaves de API geradas.</p>
          )}
        </div>

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
                onChange={onNewEmailChange}
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
              onClick={onStartEmailEdit}
            >
              Alterar e-mail
            </Button>
          )}
        </div>

        {emailChangeSuccess && !isEditingEmail && (
          <p className="text-sm text-neutral-600">
            Aguarda confirmação por e-mail — até confirmar, o e-mail ativo é <strong>{email}</strong>
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
              {isChangingEmail ? "A enviar..." : "Confirmar"}
            </Button>
            <Button
              appearance="outline"
              variant="neutral"
              onClick={onCancelEmailEdit}
              disabled={isChangingEmail}
            >
              Cancelar
            </Button>
          </div>
        )}

        <div className="flex items-end gap-16">
          <div className="flex-1">
            <InputText
              label="Senha"
              placeholder="••••••••"
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
              Alterar senha
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
          {isSaving ? "A guardar..." : "Guardar"}
        </Button>
      </div>

      {hasAvatar && (
        <div className="dataset-edit-danger-actions" style={{ marginTop: 16 }}>
          <StatusCard
            variant="danger"
            showIcon
            description={
              <>
                <strong>Atenção esta ação é irreversível.</strong>
                <br />
                <Button
                  appearance="link"
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-arrow-right-circle"
                  trailingIconHover="agora-solid-arrow-right-circle"
                  onClick={onDeleteAvatar}
                  disabled={isDeletingAvatar}
                >
                  {isDeletingAvatar ? "A eliminar..." : "Eliminar foto de perfil"}
                </Button>
              </>
            }
          />
        </div>
      )}
    </div>
  );
}
