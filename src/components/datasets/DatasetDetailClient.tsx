"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, ModalProvider, Toggle } from "@ama-pt/agora-design-system";
import { Hero } from "@/components/Shared/Hero";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import type { DatasetDetail, ResourceSectionPage } from "@/service/types/dataset/detail";
import { followEntity, isFollowing, unfollowEntity } from "@/service/api/followers";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { DatasetTabs } from "@/components/datasets/DatasetTabs";
import { DatasetBadges } from "@/components/datasets/DatasetBadges";
import { DatasetDetailSidebar } from "@/components/datasets/DatasetDetailSidebar";
import { DescriptionWithReadMore } from "@/components/Shared/DescriptionWithReadMore";
import { getDatasetLastUpdate } from "@/utils/datasetDates";
import { formatPortalDate } from "@/utils/formatDate";

interface DatasetDetailClientProps {
  dataset: DatasetDetail;
  resourceSections: ResourceSectionPage[];
}

export default function DatasetDetailClient({
  dataset,
  resourceSections,
}: DatasetDetailClientProps) {
  const { t: tds } = useTranslation("datasets");
  const { user, isAdmin } = useAuth();
  const { organizations } = useActiveOrganization();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const descriptionHeadingRef = useRef<HTMLDivElement>(null);
  const lastUpdate = getDatasetLastUpdate(dataset);

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
      <main className="flex w-full flex-col">
        <Hero.Root variant="light">
          <Hero.Breadcrumb darkMode={false} currentLabel={dataset.title} />
          <Hero.Content className="max-w-[592px]">
            <Hero.Title className="text-3xl-bold! leading-normal wrap-anywhere text-primary-900">
              {dataset.title}
            </Hero.Title>
            <DatasetBadges badges={dataset.badges} />
          </Hero.Content>
          {lastUpdate && (
            <time dateTime={lastUpdate} className="text-m-regular text-primary-900">
              {tds("detail.updatedOn", { date: formatPortalDate(lastUpdate, "dd.MM.yyyy") })}
            </time>
          )}
        </Hero.Root>

        <div className="flex flex-col items-center gap-32 pt-32 pb-64">
          <div className="container flex flex-col items-start gap-16 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-16">
              <ResourceStatusBadge
                item={dataset}
                display="pill"
                className="px-16 py-4"
                labels={{ public: tds("detail.published") }}
              />
              {(isAdmin ||
                (user && dataset.owner?.id === user.id) ||
                (dataset.organization &&
                  organizations.some((org) => org.id === dataset.organization?.id))) && (
                <Link href={`/admin/me/datasets/edit?id=${dataset.id}`}>
                  <Button
                    variant="neutral"
                    appearance="link"
                    className="p-[14px]"
                    hasIcon
                    leadingIcon="agora-line-edit"
                    leadingIconHover="agora-solid-edit"
                  >
                    {tds("detail.edit")}
                  </Button>
                </Link>
              )}
            </div>
            <Toggle
              id="dataset-favorite"
              name="dataset-favorite"
              appearance="text"
              className="min-h-[60px]! px-[14px]"
              hasIcon
              leadingIcon={isFavorite ? "agora-solid-bookmark" : "agora-line-bookmark"}
              leadingIconHover="agora-solid-bookmark"
              checked={isFavorite}
              onChange={handleToggleFavorite}
              onKeyUp={(event) => {
                if (event.code === "Space" || event.code === "Enter") {
                  void handleToggleFavorite();
                }
              }}
              disabled={isTogglingFavorite}
            >
              {isFavorite ? tds("detail.removeFavorite") : tds("detail.addFavorite")}
            </Toggle>
          </div>

          <div className="container grid gap-32 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-6">
              <div ref={descriptionHeadingRef} className="pb-32">
                <h2 className="text-xl-bold text-neutral-900">{tds("labels.description")}:</h2>
              </div>
              <DescriptionWithReadMore
                text={dataset.description}
                sidebarRef={sidebarRef}
                titleRef={descriptionHeadingRef}
              />
            </div>
            <div className="min-w-0 xl:col-span-6">
              <DatasetDetailSidebar dataset={dataset} sidebarRef={sidebarRef} />
            </div>
          </div>
        </div>

        <DatasetTabs dataset={dataset} resourceSections={resourceSections} />
      </main>
    </ModalProvider>
  );
}
