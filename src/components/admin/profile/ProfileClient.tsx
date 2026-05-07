"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  fetchFullProfile,
  fetchUserActivity,
  fetchCsrfToken,
  updateProfile,
  uploadAvatar,
  generateApiKey,
  fetchApiTokens,
  revokeApiToken,
  requestEmailChange,
  fetchMyFollowing,
} from "@/services/api";
import { Activity, ApiToken, UserFollowing, UserPublic } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Avatar,
  Breadcrumb,
  Button,
  CardNoResults,
  Icon,
  InputText,
  InputTextArea,
  StatusCard,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import { ChangePasswordPopupContent } from "@/components/admin/profile/ChangePasswordPopupContent";

const activityLabels: Record<string, string> = {
  "created a dataset": "criou um conjunto de dados",
  "updated a dataset": "atualizou um conjunto de dados",
  "deleted a dataset": "eliminou um conjunto de dados",
  "added a resource to a dataset": "adicionou um recurso a um conjunto de dados",
  "updated a resource": "atualizou um recurso",
  "removed a resource from a dataset": "removeu um recurso de um conjunto de dados",
  "created a dataservice": "criou um serviço de dados",
  "updated a dataservice": "atualizou um serviço de dados",
  "deleted a dataservice": "eliminou um serviço de dados",
  "created a topic": "criou um tema",
  "updated a topic": "atualizou um tema",
  "added an element to a topic": "adicionou um elemento a um tema",
  "updated an element in a topic": "atualizou um elemento num tema",
  "removed an element from a topic": "removeu um elemento de um tema",
  "created an organization": "criou uma organização",
  "updated an organization": "atualizou uma organização",
  "followed a user": "seguiu um utilizador",
  "discussed a dataservice": "comentou um serviço de dados",
  "discussed a dataset": "comentou um conjunto de dados",
  "discussed a reuse": "comentou uma reutilização",
  "followed a dataservice": "seguiu um serviço de dados",
  "followed a dataset": "seguiu um conjunto de dados",
  "followed a reuse": "seguiu uma reutilização",
  "followed an organization": "seguiu uma organização",
  "created a reuse": "criou uma reutilização",
  "updated a reuse": "atualizou uma reutilização",
  "deleted a reuse": "eliminou uma reutilização",
};

const translateActivityLabel = (label: string) => activityLabels[label] ?? label;

export default function ProfileClient() {
  const router = useRouter();
  const { show } = usePopupContext();
  const { displayName } = useCurrentUser();
  const { user, samlLogin, refresh } = useAuth();

  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [about, setAbout] = useState("");
  const [website, setWebsite] = useState("");
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newTokenName, setNewTokenName] = useState("");
  const [revokingTokenId, setRevokingTokenId] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [email, setEmail] = useState("");

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPageSize, setActivityPageSize] = useState(20);

  const [subscriptions, setSubscriptions] = useState<UserFollowing[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchFullProfile();
        setProfile(data);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setAbout(data.about || "");
        setWebsite(data.website || "");
        setEmail(data.email || "");
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    async function loadApiTokens() {
      try {
        const tokens = await fetchApiTokens();
        setApiTokens(tokens);
      } catch (error) {
        console.error("Error loading API tokens:", error);
      }
    }
    loadProfile();
    loadApiTokens();
  }, []);

  useEffect(() => {
    async function loadActivities() {
      if (!user?.id) return;
      setIsLoadingActivities(true);
      try {
        const response = await fetchUserActivity(user.id, activityPage, activityPageSize);
        setActivities(response.data || []);
        setActivityTotal(response.total || 0);
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setIsLoadingActivities(false);
      }
    }
    loadActivities();
  }, [user?.id, activityPage, activityPageSize]);

  useEffect(() => {
    async function loadSubscriptions() {
      setIsLoadingSubscriptions(true);
      try {
        const response = await fetchMyFollowing(1, 100);
        setSubscriptions(response.data || []);
      } catch (error) {
        console.error("Error loading subscriptions:", error);
      } finally {
        setIsLoadingSubscriptions(false);
      }
    }
    loadSubscriptions();
  }, []);

  const handleSave = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      const updated = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        about,
        website,
      });
      setProfile(updated);
      setSaveSuccess(true);
      await refresh();
      setTimeout(() => setSaveSuccess(false), 10000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveError("Erro ao guardar o perfil. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateApiKey = async () => {
    setIsGeneratingKey(true);
    setTokenCopied(false);
    try {
      const created = await generateApiKey(newTokenName.trim() || undefined);
      setNewToken(created.token);
      setApiTokens((prev) => [
        {
          id: created.id,
          token_prefix: created.token_prefix,
          name: created.name,
          scopes: created.scopes,
          kind: created.kind,
          created_at: created.created_at,
          last_used_at: created.last_used_at,
          user_agents: created.user_agents,
          revoked_at: created.revoked_at,
          expires_at: created.expires_at,
        },
        ...prev,
      ]);
      setNewTokenName("");
    } catch (error) {
      console.error("Error generating API key:", error);
      setSaveError("Erro ao gerar a chave da API. Tente novamente.");
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleCopyToken = async () => {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 3000);
    } catch (error) {
      console.error("Error copying token:", error);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    setRevokingTokenId(tokenId);
    try {
      await revokeApiToken(tokenId);
      setApiTokens((prev) => prev.filter((t) => t.id !== tokenId));
    } catch (error) {
      console.error("Error revoking API token:", error);
      setSaveError("Erro ao revogar a chave da API. Tente novamente.");
    } finally {
      setRevokingTokenId(null);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 4194304) {
      setAvatarError("O ficheiro excede o tamanho máximo de 4 MB.");
      return;
    }
    setAvatarError(null);
    try {
      await uploadAvatar(file);
      const updated = await fetchFullProfile();
      setProfile(updated);
      await refresh();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setSaveError("Erro ao carregar a foto de perfil. Tente novamente.");
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === email) return;
    setIsChangingEmail(true);
    setSaveError("");
    setEmailChangeSuccess(false);
    try {
      const csrfToken = await fetchCsrfToken();
      await requestEmailChange(newEmail, csrfToken);
      setEmailChangeSuccess(true);
      setIsEditingEmail(false);
      setNewEmail("");
    } catch (error) {
      console.error("Error requesting email change:", error);
      setSaveError(
        "Erro ao solicitar a alteração de e-mail. Verifique o endereço e tente novamente."
      );
    } finally {
      setIsChangingEmail(false);
    }
  };

  const lastModified = profile?.since
    ? format(new Date(profile.since), "d 'de' MMMM 'de' yyyy", { locale: pt })
    : "";

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: displayName || "...", url: "#" },
            { label: "Perfil", url: "/pages/admin/me/profile" },
          ]}
        />
      </div>

      <h1 className="admin-page__title mt-[64px] mb-[32px]">Perfil</h1>

      <div className="profile-card">
        <Avatar
          avatarType={profile?.avatar_thumbnail ? "image" : "initials"}
          srcPath={
            (profile?.avatar_thumbnail ||
              `${(profile?.first_name || "")[0] || ""}${(profile?.last_name || "")[0] || ""}`.toUpperCase()) as unknown as undefined
          }
          alt={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`}
          className="profile-card__avatar"
        />

        <div className="profile-card__body">
          <div className="profile-card__info">
            {profile?.organizations?.[0] && (
              <p className="text-neutral-900 text-base font-light leading-7">
                {profile.organizations[0].name}
              </p>
            )}
            <p className="text-neutral-900 text-xl font-semibold leading-8">
              {profile ? `${profile.first_name} ${profile.last_name}` : "..."}
            </p>
            {lastModified && (
              <p className="text-neutral-900 text-base leading-7">
                <span className="font-semibold">Membro desde:</span> {lastModified}
              </p>
            )}
          </div>

          <div className="absolute top-[32px] right-[32px]">
            <Button
              variant="primary"
              appearance="outline"
              className="bg-white"
              hasIcon
              leadingIcon="agora-line-eye"
              leadingIconHover="agora-solid-eye"
              onClick={() => router.push(`/pages/users/${user?.slug || ""}`)}
            >
              Ver perfil público
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-[32px]">
        <Tabs>
          <Tab active>
            <TabHeader>Perfil</TabHeader>
            <TabBody>
              <div
                className="admin-page__form mt-[24px]"
                style={{
                  maxWidth:
                    "calc(100% - var(--admin-auxiliar-width) - var(--admin-auxiliar-gap))",
                }}
              >
                <h2 className="admin-page__section-title">EDITAR PERFIL</h2>

                {saveSuccess && (
                  <StatusCard
                    variant="success"
                    showIcon
                    description="Perfil guardado com sucesso."
                  />
                )}
                {saveError && (
                  <StatusCard variant="danger" showIcon description={saveError} />
                )}

                <div className="admin-page__fields-group">
                  <div className="flex gap-[18px]">
                    <div className="flex-1">
                      <InputText
                        label="Nome *"
                        placeholder="Insira o nome aqui"
                        id="first-name"
                        value={firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFirstName(e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <InputText
                        label="Último nome *"
                        placeholder="Insira o apelido aqui"
                        id="last-name"
                        value={lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLastName(e.target.value)
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
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setAbout(e.target.value)
                    }
                  />

                  <InputText
                    label="Site da Internet"
                    placeholder="Insira o URL aqui"
                    id="website"
                    value={website}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWebsite(e.target.value)
                    }
                  />

                  <div>
                    <span className="text-primary-900 text-base font-medium leading-7">
                      Foto de perfil
                    </span>
                    <div className="mt-2 [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit">
                      <DragAndDropUploader
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
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-[16px]">
                    <div>
                      <p className="text-base font-medium text-neutral-900 mb-[8px]">
                        Chaves da API
                      </p>
                      <p className="text-sm text-neutral-700 mb-[16px]">
                        Gere uma chave para autenticar pedidos à API. Por motivos de segurança,
                        a chave completa só é apresentada uma vez no momento da criação —
                        guarde-a num local seguro.
                      </p>
                    </div>

                    <div className="flex items-end gap-[16px]">
                      <div className="flex-1">
                        <InputText
                          label="Nome da nova chave (opcional)"
                          placeholder="Ex.: Script backup, Integração X..."
                          id="new-token-name"
                          value={newTokenName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewTokenName(e.target.value)
                          }
                        />
                      </div>
                      <Button
                        appearance="outline"
                        variant="primary"
                        hasIcon
                        leadingIcon="agora-line-edit"
                        leadingIconHover="agora-solid-edit"
                        onClick={handleGenerateApiKey}
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
                          <div className="flex flex-col gap-[8px]">
                            <p>
                              <strong>Copie esta chave agora.</strong> Não voltará a ser
                              apresentada.
                            </p>
                            <div className="flex items-center gap-[8px]">
                              <code className="flex-1 bg-neutral-50 border border-neutral-300 rounded-[4px] px-[12px] py-[8px] text-xs break-all">
                                {newToken}
                              </code>
                              <Button
                                appearance="outline"
                                variant="primary"
                                hasIcon
                                leadingIcon={tokenCopied ? "agora-line-check" : "agora-line-copy"}
                                leadingIconHover={
                                  tokenCopied ? "agora-solid-check" : "agora-solid-copy"
                                }
                                onClick={handleCopyToken}
                              >
                                {tokenCopied ? "Copiado" : "Copiar"}
                              </Button>
                            </div>
                          </div>
                        }
                      />
                    )}

                    {apiTokens.length > 0 ? (
                      <div className="flex flex-col gap-[8px]">
                        <p className="text-sm font-medium text-neutral-900">
                          Chaves activas ({apiTokens.length})
                        </p>
                        <div className="flex flex-col divide-y divide-neutral-200 border border-neutral-200 rounded-[4px]">
                          {apiTokens.map((token) => (
                            <div
                              key={token.id}
                              className="flex items-center justify-between gap-[16px] px-[16px] py-[12px]"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-[8px]">
                                  <code className="text-sm font-mono text-neutral-900">
                                    {token.token_prefix}…
                                  </code>
                                  {token.name && (
                                    <span className="text-sm text-neutral-700">
                                      — {token.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-neutral-700 mt-[4px]">
                                  Criada em{" "}
                                  {format(new Date(token.created_at), "dd/MM/yyyy", {
                                    locale: pt,
                                  })}
                                  {token.last_used_at
                                    ? ` · último uso ${formatDistanceToNow(
                                        new Date(token.last_used_at),
                                        { locale: pt, addSuffix: true }
                                      )}`
                                    : " · nunca utilizada"}
                                </p>
                              </div>
                              <Button
                                appearance="outline"
                                variant="danger"
                                hasIcon
                                leadingIcon="agora-line-trash"
                                leadingIconHover="agora-solid-trash"
                                onClick={() => handleRevokeToken(token.id)}
                                disabled={revokingTokenId === token.id}
                              >
                                {revokingTokenId === token.id ? "A revogar..." : "Revogar"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-700 italic">
                        Ainda não tem chaves de API geradas.
                      </p>
                    )}
                  </div>

                  {emailChangeSuccess && (
                    <StatusCard
                      variant="success"
                      showIcon
                      description="Foi enviado um e-mail de confirmação para o novo endereço. Verifique a sua caixa de entrada."
                    />
                  )}

                  <div className="flex items-end gap-[16px]">
                    <div className="flex-1">
                      {isEditingEmail ? (
                        <InputText
                          label="Novo endereço de e-mail"
                          placeholder="Insira o novo e-mail aqui"
                          id="new-email"
                          value={newEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewEmail(e.target.value)
                          }
                        />
                      ) : (
                        <InputText
                          label="Endereço de e-mail"
                          placeholder="Insira o e-mail aqui"
                          id="email"
                          value={email}
                          readOnly
                        />
                      )}
                    </div>
                    {!samlLogin && (
                      <>
                        {isEditingEmail ? (
                          <div className="flex gap-[8px]">
                            <Button
                              appearance="outline"
                              variant="primary"
                              onClick={handleEmailChange}
                              disabled={isChangingEmail || !newEmail || newEmail === email}
                            >
                              {isChangingEmail ? "A enviar..." : "Confirmar"}
                            </Button>
                            <Button
                              appearance="outline"
                              variant="neutral"
                              onClick={() => {
                                setIsEditingEmail(false);
                                setNewEmail("");
                              }}
                              disabled={isChangingEmail}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            appearance="outline"
                            variant="neutral"
                            hasIcon
                            leadingIcon="agora-line-edit"
                            leadingIconHover="agora-solid-edit"
                            onClick={() => {
                              setIsEditingEmail(true);
                              setNewEmail(email);
                            }}
                          >
                            Alterar e-mail
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-end gap-[16px]">
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
                        onClick={() =>
                          show(<ChangePasswordPopupContent />, {
                            title: "Altere a sua senha",
                            closeAriaLabel: "Fechar",
                            dimensions: "m",
                          })
                        }
                      >
                        Alterar senha
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-[16px]">
                  <Button
                    variant="primary"
                    hasIcon={true}
                    leadingIcon="agora-line-check-circle"
                    leadingIconHover="agora-solid-check-circle"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>Atividades</TabHeader>
            <TabBody>
              <div className="mt-[24px]">
                {isLoadingActivities && (
                  <p className="text-neutral-700 text-sm">A carregar...</p>
                )}
                {!isLoadingActivities && activities.length === 0 && (
                  <CardNoResults
                    className="datasets-page__empty"
                    position="center"
                    icon={
                      <Icon
                        name="agora-line-time"
                        className="w-12 h-12 text-primary-500 icon-xl"
                      />
                    }
                    title="Sem atividades"
                    description="Nenhuma atividade registada."
                    hasAnchor={false}
                  />
                )}
                {!isLoadingActivities && activities.length > 0 && (
                  <>
                    <h2 className="font-medium text-neutral-900 text-base mb-[16px]">
                      {activityTotal} ATIVIDADES
                    </h2>
                    <Table
                      paginationProps={{
                        itemsPerPageLabel: "Itens por página",
                        itemsPerPage: activityPageSize,
                        totalItems: activityTotal,
                        availablePageSizes: [10, 20, 50],
                        currentPage: activityPage - 1,
                        buttonDropdownAriaLabel: "Selecionar itens por página",
                        dropdownListAriaLabel: "Opções de itens por página",
                        prevButtonAriaLabel: "Página anterior",
                        nextButtonAriaLabel: "Próxima página",
                        onPageChange: (page: number) => setActivityPage(page + 1),
                        onPageSizeChange: (size: number) => {
                          setActivityPageSize(size);
                          setActivityPage(1);
                        },
                      }}
                    >
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Utilizador</TableHeaderCell>
                          <TableHeaderCell>Ação</TableHeaderCell>
                          <TableHeaderCell>Data</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activities.map((activity, index) => (
                          <TableRow key={index}>
                            <TableCell headerLabel="Utilizador">
                              <div className="flex items-center gap-[8px]">
                                <Avatar
                                  avatarType={
                                    activity.actor?.avatar_thumbnail ? "image" : "initials"
                                  }
                                  srcPath={
                                    (activity.actor?.avatar_thumbnail ||
                                      `${(activity.actor?.first_name || "")[0] || ""}${(activity.actor?.last_name || "")[0] || ""}`.toUpperCase()) as unknown as undefined
                                  }
                                  alt={`${activity.actor?.first_name || ""} ${activity.actor?.last_name || ""}`}
                                />
                                <a
                                  href={`/pages/admin/users/${activity.actor?.id}`}
                                  className="text-primary-600 underline text-sm"
                                >
                                  {activity.actor?.first_name} {activity.actor?.last_name}
                                </a>
                              </div>
                            </TableCell>
                            <TableCell headerLabel="Ação">
                              {translateActivityLabel(activity.label)}
                            </TableCell>
                            <TableCell headerLabel="Data">
                              {new Date(activity.created_at).toLocaleDateString("pt-PT", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </div>
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>Subscrições</TabHeader>
            <TabBody>
              <div className="mt-[24px]">
                {isLoadingSubscriptions ? (
                  <p className="text-neutral-900 text-base">A carregar subscrições...</p>
                ) : subscriptions.length === 0 ? (
                  <CardNoResults
                    className="datasets-page__empty"
                    position="center"
                    icon={
                      <Icon
                        name="agora-line-bell"
                        className="w-12 h-12 text-primary-500 icon-xl"
                      />
                    }
                    title="Sem subscrições"
                    description="Não segue conteúdos"
                    hasAnchor={false}
                  />
                ) : (
                  <div className="flex flex-col gap-16">
                    {subscriptions.map((sub) => {
                      const subName = sub.following.name || sub.following.title || "";
                      const subAvatar = sub.following.avatar_thumbnail || sub.following.image_thumbnail;
                      const initials = subName
                        .split(" ")
                        .map((w) => w.charAt(0).toUpperCase())
                        .slice(0, 2)
                        .join("");
                      const classToPath: Record<string, string> = {
                        Dataset: "/pages/datasets",
                        Organization: "/pages/organizations",
                        Reuse: "/pages/reuses",
                        User: "/pages/users",
                      };
                      const basePath = classToPath[sub.following.class];
                      const href = basePath && sub.following.slug
                        ? `${basePath}/${sub.following.slug}`
                        : null;
                      const content = (
                        <div className="flex items-center gap-16">
                          <Avatar
                            avatarType={subAvatar ? "image" : "initials"}
                            srcPath={(subAvatar || initials) as unknown as undefined}
                            alt={subName}
                            className="w-[48px] h-[48px]"
                          />
                          <span className="text-neutral-900 text-base font-medium">{subName}</span>
                        </div>
                      );
                      return href ? (
                        <Link key={sub.id} href={href} className="hover:opacity-80 transition-opacity">
                          {content}
                        </Link>
                      ) : (
                        <div key={sub.id}>{content}</div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>Acompanhamentos</TabHeader>
            <TabBody>
              <div className="mt-[24px]">
                <CardNoResults
                  className="datasets-page__empty"
                  position="center"
                  icon={
                    <Icon
                      name="agora-line-star"
                      className="w-12 h-12 text-primary-500 icon-xl"
                    />
                  }
                  title="Sem acompanhamentos"
                  description="Não tem seguidores"
                  hasAnchor={false}
                />
              </div>
            </TabBody>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
