"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchUser, fetchUserActivity, updateUser } from "@/services/api";
import { Activity, UserAdmin } from "@/types/api";
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
  Tabs,
  Tab,
  TabHeader,
  TabBody,
} from "@ama-pt/agora-design-system";

export default function UserProfileClient() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [about, setAbout] = useState("");
  const [website, setWebsite] = useState("");
  const [role, setRole] = useState("editor");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const activityPageSize = 20;

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await fetchUser(userId);
        if (!data) {
          router.push("/pages/admin/system/users");
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

  const totalActivityPages = Math.ceil(activityTotal / activityPageSize);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 10000);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      setSaveError("Erro ao guardar o perfil. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const groupActivitiesByMonth = (acts: Activity[]) => {
    const groups: Record<string, Activity[]> = {};
    acts.forEach((act) => {
      const key = format(new Date(act.created_at), "MMMM 'de' yyyy", { locale: pt });
      if (!groups[key]) groups[key] = [];
      groups[key].push(act);
    });
    return groups;
  };

  if (isLoading) return <p>A carregar...</p>;
  if (!user) return null;

  const displayName = `${user.first_name} ${user.last_name}`.trim();
  const lastModified = user.since
    ? format(new Date(user.since), "d 'de' MMMM 'de' yyyy", { locale: pt })
    : "";

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Utilizadores", url: "/pages/admin/system/users" },
            { label: displayName || "...", url: "#" },
          ]}
        />
      </div>

      <h1 className="admin-page__title mt-[64px] mb-[32px]">Perfil</h1>

      <div className="profile-card">
        <Avatar
          avatarType={user.avatar_thumbnail ? "image" : "initials"}
          srcPath={
            (user.avatar_thumbnail ||
              `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()) as unknown as undefined
          }
          alt={displayName}
          className="profile-card__avatar"
        />

        <div className="profile-card__body">
          <div className="profile-card__info">
            {user.organizations?.[0] && (
              <p className="text-neutral-900 text-base font-light leading-7">
                {user.organizations[0].name}
              </p>
            )}
            <p className="text-neutral-900 text-xl font-semibold leading-8">{displayName}</p>
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
              onClick={() => router.push(`/pages/users/${user.slug}`)}
            >
              Ver perfil público
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-[32px]">
        <Tabs>
          <Tab active>
            <TabHeader>Perfil</TabHeader>
            <TabBody>
              <div
                className="admin-page__form mt-[24px]"
                style={{
                  maxWidth: "calc(100% - var(--admin-auxiliar-width) - var(--admin-auxiliar-gap))",
                }}
              >
                <h2 className="admin-page__section-title">EDITAR PERFIL</h2>

                {saveSuccess && (
                  <StatusCard type="success" description="Perfil guardado com sucesso." />
                )}
                {saveError && <StatusCard type="danger" description={saveError} />}

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
                        placeholder="Insira o último nome aqui"
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

                  {isAdmin && (
                  <div className="flex flex-col gap-[12px]">
                    <span className="text-primary-900 text-base font-medium leading-7">
                      Perfil <span className="text-danger-600">*</span>
                    </span>
                    <div className="flex gap-[24px]">
                      {[
                        { value: "admin", label: "Administrador" },
                        { value: "editor", label: "Editor" },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={role === value}
                          onClick={() => setRole(value)}
                          className="flex items-start gap-[8px] bg-transparent border-0 cursor-pointer p-0 min-h-[44px]"
                        >
                          <div className="p-[10px]">
                            <div
                              className={`flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full ${
                                role === value
                                  ? "border-[6px] border-primary-600 bg-primary-600"
                                  : "border-2 border-neutral-900"
                              }`}
                            >
                              {role === value && (
                                <span className="block h-[12px] w-[12px] rounded-full bg-white" />
                              )}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWebsite(e.target.value)
                    }
                  />

                  {user.email && (
                    <InputText
                      label="Endereço de e-mail"
                      placeholder="Insira o endereço de e-mail aqui"
                      id="email"
                      value={user.email}
                      readOnly
                    />
                  )}
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

                {isAdmin && <div className="dataset-edit-danger-actions">
                  <StatusCard
                    type="warning"
                    description={
                      <>
                        <strong>
                          {user.active
                            ? "Uma conta desativada impede o utilizador de iniciar sessão no portal, mas os seus dados permanecem acessíveis."
                            : "Esta conta está desativada. O utilizador não consegue iniciar sessão no portal."}
                        </strong>
                        <br />
                        <Button
                          appearance="link"
                          variant="primary"
                          hasIcon
                          trailingIcon="agora-line-arrow-right-circle"
                          trailingIconHover="agora-solid-arrow-right-circle"
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleActive();
                          }}
                        >
                          {user.active ? "Desativar conta" : "Ativar conta"}
                        </Button>
                      </>
                    }
                  />
                </div>}
              </div>
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>Atividades</TabHeader>
            <TabBody>
              <div className="mt-[24px]">
                {isLoadingActivities ? (
                  <p className="text-neutral-900 text-base">A carregar atividades...</p>
                ) : activities.length === 0 ? (
                  <CardNoResults
                    className="datasets-page__empty"
                    position="center"
                    icon={
                      <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
                    }
                    title="Sem atividades"
                    description="Nenhuma atividade registada."
                    hasAnchor={false}
                  />
                ) : (
                  <div className="space-y-32">
                    {Object.entries(groupActivitiesByMonth(activities)).map(([month, acts]) => (
                      <div key={month}>
                        <h3 className="text-neutral-900 text-sm font-medium mb-16">{month}</h3>
                        <div className="relative border-l-2 border-neutral-200 ml-4">
                          {acts.map((act, idx) => (
                            <div key={idx} className="flex items-start gap-16 pb-16 ml-16 relative">
                              <div className="absolute -left-[25px] top-1 w-8 h-8 rounded-full bg-neutral-300" />
                              <div className="flex-1 flex items-start justify-between">
                                <div>
                                  <span className="text-sm">
                                    <Icon
                                      name="agora-line-user"
                                      className="w-4 h-4 inline text-primary-600 mr-4"
                                    />
                                    <span className="text-primary-600 font-medium">
                                      {act.actor.first_name} {act.actor.last_name}
                                    </span>
                                    {" \u25BA "}
                                    <span className="text-neutral-900">{act.label}</span>
                                  </span>
                                  {act.related_to_url && (
                                    <div>
                                      <a
                                        href={act.related_to_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 text-sm underline"
                                      >
                                        {act.related_to}
                                        <Icon
                                          name="agora-line-external-link"
                                          className="w-3 h-3 inline ml-4"
                                        />
                                      </a>
                                    </div>
                                  )}
                                </div>
                                <span className="text-neutral-900 text-sm whitespace-nowrap ml-16">
                                  {format(new Date(act.created_at), "d 'de' MMMM 'de' yyyy", {
                                    locale: pt,
                                  })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {totalActivityPages > 1 && (
                      <div className="flex items-center justify-center gap-8 mt-32">
                        <Button
                          variant="primary"
                          appearance="outline"
                          onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                          disabled={activityPage === 1}
                        >
                          Anterior
                        </Button>
                        <span className="text-neutral-900 text-sm">
                          Pagina {activityPage} de {totalActivityPages}
                        </span>
                        <Button
                          variant="primary"
                          appearance="outline"
                          onClick={() =>
                            setActivityPage((p) => Math.min(totalActivityPages, p + 1))
                          }
                          disabled={activityPage === totalActivityPages}
                        >
                          Seguinte
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabBody>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
