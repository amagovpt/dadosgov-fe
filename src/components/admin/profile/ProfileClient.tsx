"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTemporaryMessage } from "@/hooks/forms/useTemporaryMessage";
import { fetchMyFollowing } from "@/service/api/followers";
import {
  fetchFullProfile,
  uploadAvatar,
  deleteAvatar,
  generateApiKey,
  fetchApiTokens,
  revokeApiToken,
  requestEmailChange,
} from "@/service/api/profile";
import { fetchUserActivity, updateProfile } from "@/service/api/users";
import { Activity } from "@/service/types/catalog";
import { ApiToken, UserFollowing, UserPublic } from "@/service/types/identity";
import {
  CardNoResults,
  Icon,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
} from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { toProxiedUrl } from "./profileUtils";
import { ProfileCard } from "./ProfileCard";
import { ProfileFormTab } from "./ProfileFormTab";
import { SubscriptionsTab } from "./SubscriptionsTab";
import { ActivitiesTab } from "./ActivitiesTab";

export default function ProfileClient() {
  const router = useRouter();
  const { displayName } = useCurrentUser();
  const { user, samlLogin, refresh } = useAuth();

  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [about, setAbout] = useState("");
  const [website, setWebsite] = useState("");

  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newTokenName, setNewTokenName] = useState("");
  const [revokingTokenId, setRevokingTokenId] = useState<string | null>(null);
  const {
    message: tokenCopied,
    setMessage: setTokenCopied,
    setTemporaryMessage: showTokenCopied,
  } = useTemporaryMessage<boolean>(false, 3000);

  const [email, setEmail] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const {
    message: saveSuccess,
    setMessage: setSaveSuccess,
    setTemporaryMessage: showSaveSuccess,
  } = useTemporaryMessage<boolean>(false);
  const [saveError, setSaveError] = useState("");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [avatarUploaderKey, setAvatarUploaderKey] = useState(0);

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
        if (data.avatar_thumbnail) {
          setAvatarPreview(toProxiedUrl(data.avatar_thumbnail));
        }
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setAbout(data.about || "");
        setWebsite(data.website || "");
        setEmail(data.email || "");
      } catch (error) {
        console.error("Error loading profile:", error);
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

    void loadProfile();
    void loadApiTokens();
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

    void loadActivities();
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

    void loadSubscriptions();
  }, []);

  const handleSave = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      showSaveSuccess(true);
      await refresh();
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
      setApiTokens((previousTokens) => [
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
        ...previousTokens,
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
      showTokenCopied(true);
    } catch (error) {
      console.error("Error copying token:", error);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    setRevokingTokenId(tokenId);
    try {
      await revokeApiToken(tokenId);
      setApiTokens((previousTokens) => previousTokens.filter((token) => token.id !== tokenId));
    } catch (error) {
      console.error("Error revoking API token:", error);
      setSaveError("Erro ao revogar a chave da API. Tente novamente.");
    } finally {
      setRevokingTokenId(null);
    }
  };

  const handleDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    setSaveError("");
    try {
      await deleteAvatar();
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarUploaderKey((value) => value + 1);
      setProfile((previousProfile) =>
        previousProfile ? { ...previousProfile, avatar_thumbnail: null } : previousProfile,
      );
      await refresh();
    } catch (error) {
      console.error("Error deleting avatar:", error);
      setSaveError("Erro ao eliminar a foto de perfil. Tente novamente.");
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 4194304) {
      setAvatarError("O ficheiro excede o tamanho máximo de 4 MB.");
      return;
    }

    setAvatarError(null);
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);

    try {
      await uploadAvatar(file);
      const updated = await fetchFullProfile();
      if (updated.avatar_thumbnail) {
        if (localPreview.startsWith("blob:")) URL.revokeObjectURL(localPreview);
        setAvatarPreview(toProxiedUrl(updated.avatar_thumbnail));
        setProfile(updated);
      }
      await refresh();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      if (localPreview.startsWith("blob:")) URL.revokeObjectURL(localPreview);
      setAvatarPreview(null);
      setSaveError("Erro ao carregar a foto de perfil. Tente novamente.");
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === email) return;
    setIsChangingEmail(true);
    setSaveError("");
    setEmailChangeSuccess(false);
    try {
      await requestEmailChange(newEmail);
      setPendingEmail(newEmail);
      setEmailChangeSuccess(true);
      setIsEditingEmail(false);
      setNewEmail("");
    } catch (error) {
      console.error("Error requesting email change:", error);
      setSaveError(
        "Erro ao solicitar a alteração de e-mail. Verifique o endereço e tente novamente.",
      );
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Perfil", url: "/pages/admin/me/profile" },
      ]}
      title="Perfil"
      headerAction={null}
    >
      <ProfileCard
        profile={profile}
        avatarPreview={avatarPreview}
        onViewPublic={() => router.push(`/pages/users/${user?.slug || ""}`)}
      />

      <div className="mt-32">
        <Tabs>
          <Tab active>
            <TabHeader>Perfil</TabHeader>
            <TabBody>
              <ProfileFormTab
                profile={profile}
                firstName={firstName}
                lastName={lastName}
                about={about}
                website={website}
                isSaving={isSaving}
                saveSuccess={saveSuccess}
                saveError={saveError}
                samlLogin={!!samlLogin}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onAboutChange={setAbout}
                onWebsiteChange={setWebsite}
                onSave={handleSave}
                avatarError={avatarError}
                avatarUploaderKey={avatarUploaderKey}
                isDeletingAvatar={isDeletingAvatar}
                onAvatarChange={handleAvatarChange}
                onDeleteAvatar={handleDeleteAvatar}
                onAvatarSecurityError={() => setAvatarError(POISONED_FILE_WARNING)}
                apiTokens={apiTokens}
                newToken={newToken}
                newTokenName={newTokenName}
                tokenCopied={tokenCopied}
                isGeneratingKey={isGeneratingKey}
                revokingTokenId={revokingTokenId}
                onTokenNameChange={setNewTokenName}
                onGenerateApiKey={handleGenerateApiKey}
                onCopyToken={handleCopyToken}
                onRevokeToken={handleRevokeToken}
                email={email}
                pendingEmail={pendingEmail}
                newEmail={newEmail}
                isEditingEmail={isEditingEmail}
                isChangingEmail={isChangingEmail}
                emailChangeSuccess={emailChangeSuccess}
                onStartEditEmail={() => {
                  setIsEditingEmail(true);
                  setNewEmail(emailChangeSuccess ? pendingEmail : "");
                }}
                onNewEmailChange={setNewEmail}
                onConfirmEmailChange={handleEmailChange}
                onCancelEmailChange={() => {
                  setIsEditingEmail(false);
                  setNewEmail("");
                }}
              />
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>Subscrições</TabHeader>
            <TabBody>
              <SubscriptionsTab subscriptions={subscriptions} isLoading={isLoadingSubscriptions} />
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>Acompanhamentos</TabHeader>
            <TabBody>
              <div className="mt-24">
                <CardNoResults
                  className="admin-page__empty"
                  position="center"
                  icon={
                    <Icon name="agora-line-star" className="icon-xl h-12 w-12 text-primary-500" />
                  }
                  title="Sem acompanhamentos"
                  description="Não tem seguidores"
                  hasAnchor={false}
                />
              </div>
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>Atividades</TabHeader>
            <TabBody>
              <ActivitiesTab
                activities={activities}
                isLoading={isLoadingActivities}
                activityPage={activityPage}
                activityTotal={activityTotal}
                activityPageSize={activityPageSize}
                onPageChange={setActivityPage}
                onPageSizeChange={setActivityPageSize}
              />
            </TabBody>
          </Tab>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
