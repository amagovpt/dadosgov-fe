"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Avatar,
  Breadcrumb,
  Button,
  CardLinks,
  CardNoResults,
  Icon,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { Dataset } from "@/service/types/dataset";
import { Follow, UserFollowing, UserPublic } from "@/service/types/identity";
import { Reuse } from "@/service/types/reuse";
import { fetchMyDatasets, fetchDatasets } from "@/service/api/datasets";
import { fetchUserFollowers, fetchMyFollowing } from "@/service/api/followers";
import { fetchMyReuses, fetchReuses } from "@/service/api/reuses";
import { fetchUserProfile } from "@/service/api/users";
import { format, formatDistanceToNow } from "date-fns";
import StatusDot from "@/components/admin/StatusDot";
import { pt } from "date-fns/locale";
import AppIcon from "../Primitives/AppIcon";
import { createPaginationProps } from "@/utils/createPaginationProps";

export default function PublicProfileClient() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const isOwnProfile = user?.slug === slug;

  const [profileUser, setProfileUser] = useState<UserPublic | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<UserFollowing[]>([]);
  const [subscriptionsTotal, setSubscriptionsTotal] = useState(0);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [followersTotal, setFollowersTotal] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    async function loadData() {
      try {
        if (isOwnProfile) {
          setProfileUser(user as unknown as UserPublic);
          const [dsResponse, reuseResponse] = await Promise.all([
            fetchMyDatasets(1, 100),
            fetchMyReuses(1, 100),
          ]);
          setDatasets(dsResponse.data || []);
          setReuses(reuseResponse.data || []);
        } else {
          const fetchedUser = await fetchUserProfile(slug);
          setProfileUser(fetchedUser);
          if (fetchedUser) {
            const [dsResponse, reuseResponse] = await Promise.all([
              fetchDatasets(1, 100, { owner: fetchedUser.id }),
              fetchReuses(1, 100, { owner: fetchedUser.id }),
            ]);
            setDatasets(dsResponse.data || []);
            setReuses(reuseResponse.data || []);
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [slug, isOwnProfile, user]);

  const displayUser = isOwnProfile ? user : profileUser;

  const handleToggleSubscriptions = async () => {
    if (showSubscriptions) {
      setShowSubscriptions(false);
      return;
    }
    if (!isOwnProfile) return;
    setShowSubscriptions(true);
    setShowFollowers(false);
    setIsLoadingSubscriptions(true);
    try {
      const response = await fetchMyFollowing(1, 100);
      setSubscriptions(response.data || []);
      setSubscriptionsTotal(response.total ?? 0);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const handleToggleFollowers = async () => {
    if (showFollowers) {
      setShowFollowers(false);
      return;
    }
    const targetId = displayUser?.id;
    if (!targetId) return;
    setShowFollowers(true);
    setShowSubscriptions(false);
    setIsLoadingFollowers(true);
    try {
      const response = await fetchUserFollowers(targetId, 1, 100);
      setFollowers(response.data || []);
      setFollowersTotal(response.total ?? 0);
    } catch (error) {
      console.error("Error loading followers:", error);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  useEffect(() => {
    const targetId = displayUser?.id;
    if (targetId) {
      fetchUserFollowers(targetId, 1, 1).then((res) => {
        setFollowersTotal(res.total ?? 0);
      });
    }
    if (isOwnProfile) {
      fetchMyFollowing(1, 1).then((res) => {
        setSubscriptionsTotal(res.total ?? 0);
      });
    }
  }, [displayUser?.id, isOwnProfile]);

  const totalPages = Math.ceil(datasets.length / itemsPerPage);

  const paginatedDatasets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return datasets.slice(start, start + itemsPerPage);
  }, [datasets, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d 'de' MMMM 'de' yyyy", { locale: pt });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  const userName = displayUser
    ? `${displayUser.first_name ?? ""} ${displayUser.last_name ?? ""}`.trim()
    : "";
  const initials = displayUser
    ? `${displayUser.first_name?.charAt(0).toUpperCase() ?? ""}${displayUser.last_name?.charAt(0).toUpperCase() ?? ""}`
    : "U";

  return (
    <div className="container mx-auto mb-64">
      <div className="pb-64">
        <Breadcrumb
          items={[
            { label: "Início", url: "/" },
            { label: userName || "Perfil", url: "#" },
          ]}
        />
      </div>

      <h1 className="text-2xl-bold text-brand-blue-secondary mt-64 mb-32 max-w-[696px]">Perfil</h1>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-card__avatar-container">
          {displayUser?.avatar_thumbnail ? (
            <img
              src={displayUser.avatar_thumbnail}
              alt={userName}
              className="profile-card__avatar-img"
            />
          ) : (
            <Avatar
              avatarType={initials ? "initials" : "icon"}
              srcPath={(initials || "agora-line-user") as unknown as undefined}
              alt={userName}
              className="profile-card__avatar"
            />
          )}
        </div>

        <div className="profile-card__body">
          <div className="profile-card__info">
            {displayUser?.organizations && displayUser.organizations.length > 0 && (
              <p className="text-neutral-900 text-base font-light leading-7">
                {displayUser.organizations[0].name}
              </p>
            )}
            <p className="text-neutral-900 text-xl font-semibold leading-8">
              {userName}
            </p>
            {(displayUser as UserPublic)?.website && (
              <a
                href={(displayUser as UserPublic).website!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 text-sm leading-6 underline break-all"
              >
                {(displayUser as UserPublic).website}
              </a>
            )}
          </div>

          <div className="profile-card__links">
            {isOwnProfile && (
              <Button
                appearance="link"
                variant="primary"
                hasIcon
                leadingIcon="agora-line-package"
                leadingIconHover="agora-solid-package"
                onClick={handleToggleSubscriptions}
              >
                {subscriptionsTotal}{" "}
                {subscriptionsTotal === 1 ? "Subscrição" : "Subscrições"}
              </Button>
            )}
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-tag"
              leadingIconHover="agora-solid-tag"
              onClick={handleToggleFollowers}
            >
              {followersTotal}{" "}
              {followersTotal === 1 ? "Acompanhamento" : "Acompanhamentos"}
            </Button>
          </div>

          {isOwnProfile && (
            <div className="absolute top-32 right-32">
              <Button
                variant="primary"
                appearance="solid"
                hasIcon={true}
                leadingIcon="agora-line-edit"
                leadingIconHover="agora-solid-edit"
                onClick={() => router.push("/pages/admin/me/profile")}
              >
                Editar o meu perfil
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Biography Section */}
      {(displayUser as UserPublic)?.about && (
        <div className="mt-32">
          <p className="font-medium text-neutral-900 text-base uppercase mb-8">Biografia</p>
          <p className="text-neutral-900 text-base leading-7">{(displayUser as UserPublic).about}</p>
        </div>
      )}

      {/* Organizations Section */}
      {displayUser?.organizations && displayUser.organizations.length > 0 && (
        <div className="mt-48">
          <h2 className="font-medium text-neutral-900 text-base uppercase mb-24">
            {displayUser.organizations.length}{" "}
            {displayUser.organizations.length === 1 ? "Organização" : "Organizações"}
          </h2>

          <div className="grid grid-cols-2 agora-card-links-datasets-px0 profile-org-cards gap-24">
            {displayUser.organizations.map((org) => (
              <div key={org.id} className="h-full">
                <CardLinks
                  onClick={() =>
                    (window.location.href = `/pages/organizations/${org.slug}`)
                  }
                  className="cursor-pointer text-neutral-900"
                  variant="transparent"
                  image={{
                    src:
                      org.logo || "/images/placeholders/organization.png",
                    alt: org.name,
                  }}
                  category="Organização"
                  title={
                    <div className="underline text-xl-bold">{org.name}</div>
                  }
                  description={
                    org.description ? (
                      <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-8 max-w-[592px]">
                        {org.description}
                      </p>
                    ) : undefined
                  }
                  date={
                    org.last_modified ? (
                      <span className="font-[300]">
                        {`Atualizado há ${formatDistanceToNow(new Date(org.last_modified), { locale: pt })}`}
                      </span>
                    ) : undefined
                  }
                  links={[
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-eye",
                      leadingIconHover: "agora-solid-eye",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: org.metrics?.views
                        ? org.metrics.views >= 1000000
                          ? (org.metrics.views / 1000000)
                            .toFixed(1)
                            .replace(".", ",") + " M"
                          : org.metrics.views >= 1000
                            ? (org.metrics.views / 1000).toFixed(0) + " mil"
                            : String(org.metrics.views)
                        : "0",
                      title: "Visualizações",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-layers-menu",
                      leadingIconHover: "agora-solid-layers-menu",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: String(org.metrics?.datasets || 0),
                      title: "Datasets",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                    {
                      href: "#",
                      hasIcon: false,
                      children: (
                        <span className="flex items-center gap-8">
                          <img
                            src="/Icons/bar_chart_primary.svg"
                            alt=""
                            aria-hidden="true"
                          />
                          <span>{org.metrics?.reuses || 0}</span>
                        </span>
                      ),
                      title: "Reutilizações",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-star",
                      leadingIconHover: "agora-solid-star",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: String(org.metrics?.followers || 0),
                      title: "Favoritos",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                  ]}
                  mainLink={
                    <Link href={`/pages/organizations/${org.slug}`}>
                      <span className="underline">{org.name}</span>
                    </Link>
                  }
                  blockedLink={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscrições Section (quem eu sigo) */}
      {showSubscriptions && (
        <div className="mt-48">
          <h2 className="font-medium text-neutral-900 text-base uppercase mb-24">
            {subscriptionsTotal}{" "}
            {subscriptionsTotal === 1 ? "Subscrição" : "Subscrições"}
          </h2>

          {isLoadingSubscriptions ? (
            <p className="text-neutral-900">A carregar...</p>
          ) : subscriptions.length === 0 ? (
            <CardNoResults
              position="center"
              icon={
                <Icon
                  name="agora-line-package"
                  className="w-40 h-40 text-primary-500 icon-xl"
                />
              }
              title="Sem subscrições"
              description="Ainda não segue nenhum conteúdo."
              hasAnchor={false}
            />
          ) : (
            <div className="flex flex-col gap-16">
              {subscriptions.map((sub) => {
                const subName =
                  sub.following.name || sub.following.title || "";
                const subInitials = subName
                  .split(" ")
                  .map((w) => w.charAt(0).toUpperCase())
                  .slice(0, 2)
                  .join("");
                const subAvatar =
                  sub.following.avatar_thumbnail ||
                  sub.following.image_thumbnail;
                return (
                  <div key={sub.id} className="flex items-center gap-16">
                    <Avatar
                      avatarType={subAvatar ? "image" : "initials"}
                      srcPath={
                        (subAvatar || subInitials) as unknown as undefined
                      }
                      alt={subName}
                      className="w-48 h-48"
                    />
                    <span className="text-neutral-900 text-base font-medium">
                      {subName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Acompanhamentos Section (quem me segue) */}
      {showFollowers && (
        <div className="mt-48">
          <h2 className="font-medium text-neutral-900 text-base uppercase mb-24">
            {followersTotal}{" "}
            {followersTotal === 1 ? "Acompanhamento" : "Acompanhamentos"}
          </h2>

          {isLoadingFollowers ? (
            <p className="text-neutral-900">A carregar...</p>
          ) : followers.length === 0 ? (
            <CardNoResults
              position="center"
              icon={
                <Icon
                  name="agora-line-tag"
                  className="w-40 h-40 text-primary-500 icon-xl"
                />
              }
              title="Sem acompanhamentos"
              description="Ninguém segue este utilizador ainda."
              hasAnchor={false}
            />
          ) : (
            <div className="flex flex-col gap-16">
              {followers.map((follow) => {
                const followerName =
                  `${follow.follower.first_name ?? ""} ${follow.follower.last_name ?? ""}`.trim();
                const followerInitials =
                  `${follow.follower.first_name?.charAt(0).toUpperCase() ?? ""}${follow.follower.last_name?.charAt(0).toUpperCase() ?? ""}`;
                return (
                  <div key={follow.id} className="flex items-center gap-16">
                    <Avatar
                      avatarType={
                        follow.follower.avatar_thumbnail ? "image" : "initials"
                      }
                      srcPath={
                        (follow.follower.avatar_thumbnail ||
                          followerInitials) as unknown as undefined
                      }
                      alt={followerName}
                      className="w-48 h-48"
                    />
                    <span className="text-neutral-900 text-base font-medium">
                      {followerName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Datasets Section */}
      <div className="mt-48">
        <h2 className="font-medium text-neutral-900 text-base uppercase mb-24">
          {datasets.length} {datasets.length === 1 ? "Conjunto de dados" : "Conjuntos de dados"}
        </h2>

        {isLoading ? (
          <p className="text-neutral-900">A carregar...</p>
        ) : datasets.length === 0 ? (
          <CardNoResults
            position="center"
            icon={<Icon name="agora-line-file" className="w-40 h-40 text-primary-500 icon-xl" />}
            title="Sem conjuntos de dados"
            description="Não publicou conjuntos de dados"
            hasAnchor={false}
          />
        ) : (
          <Table
            paginationProps={createPaginationProps(
              itemsPerPage,
              datasets.length,
              currentPage,
              setCurrentPage,
              setItemsPerPage,
              {
                currentPageIsZeroBased: true,
                onPageChange: (page) => handlePageChange(page),
                onPageSizeChange: (size) => handleItemsPerPageChange(String(size)),
              }
            )}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell sortType="string">
                  Título do conjunto de dados
                </TableHeaderCell>
                <TableHeaderCell>Ficheiros</TableHeaderCell>
                <TableHeaderCell sortType="string">
                  Sigla da Entidade
                </TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell sortType="date">
                  Data de criação
                </TableHeaderCell>
                <TableHeaderCell sortType="date">
                  Data de alteração
                </TableHeaderCell>
                <TableHeaderCell>{""}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDatasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell headerLabel="Título">
                    {dataset.title}
                  </TableCell>
                  <TableCell headerLabel="Ficheiros">
                    {dataset.resources?.length || 0}
                  </TableCell>
                  <TableCell headerLabel="Sigla da Entidade">
                    {dataset.organization?.acronym || dataset.organization?.name || "—"}
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    {dataset.private ? (
                      <StatusDot variant="warning">Rascunho</StatusDot>
                    ) : (
                      <StatusDot variant="success">Público</StatusDot>
                    )}
                  </TableCell>
                  <TableCell headerLabel="Data de criação">
                    {formatShortDate(dataset.created_at)}
                  </TableCell>
                  <TableCell headerLabel="Data de alteração">
                    {formatShortDate(dataset.last_modified || dataset.created_at)}
                  </TableCell>
                  <TableCell headerLabel="">
                    <a href={`/pages/datasets/${dataset.slug}`}>
                      <AppIcon name="agora-line-eye" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Reuses Section */}
      <div className="mt-48">
        <h2 className="font-medium text-neutral-900 text-base uppercase mb-24">
          {reuses.length} {reuses.length === 1 ? "Reutilização" : "Reutilizações"}
        </h2>

        {isLoading ? (
          <p className="text-neutral-900">A carregar...</p>
        ) : reuses.length === 0 ? (
          <CardNoResults
            position="center"
            icon={<img src="/Icons/bar_chart.svg" alt="" className="w-40 h-40" />}
            title="Sem reutilizações"
            description="Não publicou reutilizações"
            hasAnchor={false}
          />
        ) : (
          <div className="grid grid-cols-2 agora-card-links-datasets-px0 gap-24">
            {reuses.map((reuse) => (
              <div key={reuse.id} className="h-full">
                <CardLinks
                  onClick={() => (window.location.href = `/pages/reuses/${reuse.slug}`)}
                  className="cursor-pointer text-neutral-900"
                  variant="transparent"
                  image={{
                    src: reuse.image_thumbnail || reuse.image || "/laptop.png",
                    alt: reuse.title,
                  }}
                  category={reuse.organization?.name || userName}
                  title={<div className="underline text-xl-bold">{reuse.title}</div>}
                  description={
                    reuse.description ? (
                      <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-8 max-w-[592px]">
                        {reuse.description}
                      </p>
                    ) : undefined
                  }
                  date={
                    <span className="font-[300]">
                      Atualizado {formatDate(reuse.last_modified || reuse.created_at)}
                    </span>
                  }
                  links={[
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-eye",
                      leadingIconHover: "agora-solid-eye",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: reuse.metrics?.views?.toLocaleString("pt-PT") || "0",
                      title: "Visualizações",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-star",
                      leadingIconHover: "agora-solid-star",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: reuse.metrics?.followers || 0,
                      title: "Favoritos",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                  ]}
                  mainLink={
                    <Link href={`/pages/reuses/${reuse.slug}`}>
                      <span className="underline">{reuse.title}</span>
                    </Link>
                  }
                  blockedLink={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
