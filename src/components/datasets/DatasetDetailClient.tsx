"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, ModalProvider } from "@ama-pt/agora-design-system";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import { Dataset } from "@/service/types/dataset";
import { followEntity, isFollowing, unfollowEntity } from "@/service/api/followers";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { DatasetTabs } from "@/components/datasets/DatasetTabs";
import { DatasetBadges } from "@/components/datasets/DatasetBadges";
import { DatasetDetailSidebar } from "@/components/datasets/DatasetDetailSidebar";
import { DescriptionWithReadMore } from "@/components/Shared/DescriptionWithReadMore";

interface DatasetDetailClientProps {
  dataset: Dataset;
}

export default function DatasetDetailClient({ dataset }: DatasetDetailClientProps) {
  const { t: tds } = useTranslation("datasets");
  const { user, isAdmin } = useAuth();
  const { organizations } = useActiveOrganization();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    isFollowing("datasets", dataset.id, user.id)
      .then((following) => {
        if (!cancelled) setIsFavorite(following);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, user?.id, dataset.id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        await unfollowEntity("datasets", dataset.id);
        setIsFavorite(false);
      } else {
        await followEntity("datasets", dataset.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <ModalProvider>
      <main className="flex w-full flex-col items-center justify-center gap-64">
        {/* Breadcrumb */}
        <div className="container flex items-center justify-between py-64">
          <BreadcrumbDynamic darkMode={false} overrides={{ [dataset.slug]: dataset.title }} />
        </div>

        {/* Actions */}
        <div className="container flex items-center justify-end gap-16">
          <ResourceStatusBadge item={dataset} display="pill" hidePublic />
          <Button
            variant="neutral"
            appearance="link"
            hasIcon={true}
            leadingIcon={isFavorite ? "agora-solid-star" : "agora-line-star"}
            leadingIconHover="agora-solid-star"
            className="flex-shrink-0"
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
          >
            {isFavorite ? tds("detail.removeFavorite") : tds("detail.addFavorite")}
          </Button>
          {(isAdmin ||
            (user && dataset.owner?.id === user.id) ||
            (dataset.organization &&
              organizations.some((org) => org.id === dataset.organization?.id))) && (
            <Link href={`/admin/me/datasets/edit?id=${dataset.id}`}>
              <Button
                variant="primary"
                hasIcon={true}
                leadingIcon="agora-line-edit"
                leadingIconHover="agora-solid-edit"
              >
                {tds("detail.edit")}
              </Button>
            </Link>
          )}
        </div>

        <div className="container grid gap-32 xl:grid-cols-12">
          {/* Main Content Column */}
          <div className="xl:col-span-6 xl:block">
            <div className="flex flex-col gap-4" ref={titleRef}>
              <h1 className="mb-24 text-xl-bold leading-tight text-primary-900">{dataset.title}</h1>
              <DatasetBadges badges={dataset.badges} className="mb-24" />
            </div>

            {/* Description */}
            <DescriptionWithReadMore
              text={dataset.description}
              sidebarRef={sidebarRef}
              titleRef={titleRef}
            />
          </div>

          {/* Sidebar */}
          <div className="min-w-0 xl:col-span-6">
            <DatasetDetailSidebar dataset={dataset} sidebarRef={sidebarRef} />
          </div>
        </div>

        {/* Tabs */}
        <DatasetTabs dataset={dataset} />
      </main>
    </ModalProvider>
  );
}
