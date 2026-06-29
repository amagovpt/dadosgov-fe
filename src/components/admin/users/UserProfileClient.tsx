"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchUserFollowing } from "@/service/api/followers";
import {
  fetchUser,
  fetchUserActivity,
  updateUser,
  deleteUser,
  uploadUserAvatar,
} from "@/service/api/users";
import { Activity } from "@/service/types/catalog";
import { UserAdmin, UserFollowing } from "@/service/types/identity";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Button,
  CardNoResults,
  Icon,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import UserAdminHeaderCard from "@/components/admin/users/UserAdminHeaderCard";
import UserAdminProfileTab from "@/components/admin/users/UserAdminProfileTab";
import UserAdminActivitiesTab from "@/components/admin/users/UserAdminActivitiesTab";
import UserAdminSubscriptionsTab from "@/components/admin/users/UserAdminSubscriptionsTab";
import { useTemporaryMessage } from "@/hooks/forms/useTemporaryMessage";

function DeleteUserPopupContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      <p>Esta ação é irreversível.</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export default function UserProfileClient() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { show, hide } = usePopupContext();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [about, setAbout] = useState("");
  const [website, setWebsite] = useState("");
  const [role, setRole] = useState("editor");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    message: saveSuccess,
    setMessage: setSaveSuccess,
    setTemporaryMessage: showSaveSuccess,
  } = useTemporaryMessage<boolean>(false);
  const [saveError, setSaveError] = useState("");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const activityPageSize = 20;

  const [subscriptions, setSubscriptions] = useState<UserFollowing[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await fetchUser(userId);
        if (!data) {
          router.push("/admin/system/users");
          return;
        }
        setUser(data);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setAbout(data.about || "");
        setWebsite(data.website || "");
        setRole(data.roles?.includes("admin") ? "admin" : "editor");
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [userId, router]);

  useEffect(() => {
    async function loadActivities() {
      if (!userId) return;
      setIsLoadingActivities(true);
      try {
        const response = await fetchUserActivity(userId, activityPage, activityPageSize);
        setActivities(response.data || []);
        setActivityTotal(response.total || 0);
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setIsLoadingActivities(false);
      }
    }
    loadActivities();
  }, [userId, activityPage]);

  useEffect(() => {
    async function loadSubscriptions() {
      if (!userId) return;
      setIsLoadingSubscriptions(true);
      try {
        const response = await fetchUserFollowing(userId, 1, 100);
        setSubscriptions(response.data || []);
      } catch (error) {
        console.error("Error loading subscriptions:", error);
      } finally {
        setIsLoadingSubscriptions(false);
      }
    }
    loadSubscriptions();
  }, [userId]);

  const totalActivityPages = Math.ceil(activityTotal / activityPageSize);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    try {
      await uploadUserAvatar(userId, files[0]);
      const updated = await fetchUser(userId);
      if (updated) setUser(updated);
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      await deleteUser(userId);
      hide();
      router.push("/admin/system/users");
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const updated = await updateUser(userId, { active: !user?.active });
      if (updated) {
        setUser(updated);
      }
    } catch (error) {
      console.error("Error toggling user active status:", error);
    }
  };

  const handleSave = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      const updated = await updateUser(userId, {
        first_name: firstName,
        last_name: lastName,
        about,
        website,
        roles: role === "admin" ? ["admin"] : [],
      });
      if (updated) {
        setUser(updated);
        showSaveSuccess(true);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      setSaveError("Erro ao guardar o perfil. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p>A carregar...</p>;
  if (!user) return null;

  const displayName = `${user.first_name} ${user.last_name}`.trim();
  const lastModified = user.since
    ? format(new Date(user.since), "d 'de' MMMM 'de' yyyy", { locale: pt })
    : "";

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/admin" },
        { label: "Utilizadores", url: "/admin/system/users" },
        { label: displayName || "..." },
      ]}
      title="Perfil"
      headerAction={null}
    >
      <UserAdminHeaderCard
        user={user}
        displayName={displayName}
        lastModified={lastModified}
        onViewPublicProfile={() => router.push(`/users/${user.slug}`)}
      />

      <div className="mt-32">
        <Tabs>
          <Tab active>
            <TabHeader>Perfil</TabHeader>
            <TabBody>
              <UserAdminProfileTab
                isAdmin={isAdmin}
                firstName={firstName}
                lastName={lastName}
                about={about}
                website={website}
                role={role}
                userEmail={user.email || ""}
                userActive={!!user.active}
                isSaving={isSaving}
                isDeleting={isDeleting}
                saveSuccess={saveSuccess}
                saveError={saveError}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onAboutChange={setAbout}
                onWebsiteChange={setWebsite}
                onRoleChange={setRole}
                onAvatarChange={handleAvatarChange}
                onSave={handleSave}
                onToggleActive={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleToggleActive();
                }}
                onOpenDeletePopup={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  show(<DeleteUserPopupContent onClose={hide} onConfirm={handleDeleteUser} />, {
                    title: "Tem a certeza que quer eliminar este utilizador?",
                    closeAriaLabel: "Fechar",
                    dimensions: "m",
                  });
                }}
              />
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>Atividades</TabHeader>
            <TabBody>
              <UserAdminActivitiesTab
                activities={activities}
                isLoading={isLoadingActivities}
                activityPage={activityPage}
                totalActivityPages={totalActivityPages}
                onPreviousPage={() => setActivityPage((page) => Math.max(1, page - 1))}
                onNextPage={() =>
                  setActivityPage((page) => Math.min(totalActivityPages, page + 1))
                }
              />
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>Subscrições</TabHeader>
            <TabBody>
              <UserAdminSubscriptionsTab
                subscriptions={subscriptions}
                isLoading={isLoadingSubscriptions}
              />
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>Acompanhamentos</TabHeader>
            <TabBody>
              <div className="mt-24">
                <CardNoResults
                  className="admin-page__empty"
                  position="center"
                  icon={<Icon name="agora-line-star" className="w-12 h-12 text-primary-500 icon-xl" />}
                  title="Sem acompanhamentos"
                  description="Não tem seguidores"
                  hasAnchor={false}
                />
              </div>
            </TabBody>
          </Tab>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
