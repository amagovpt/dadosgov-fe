"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Button,
  Icon,
  Pill,
  ProgressBar,
  CardExpandable,
} from "@ama-pt/agora-design-system";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { Dataset } from "@/service/types/dataset";
import { followEntity, isFollowing, unfollowEntity } from "@/service/api/followers";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { DatasetTabs } from "@/components/datasets/DatasetTabs";
import { DatasetBadges } from "@/components/datasets/DatasetBadges";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import {
  QUALITY_CRITERIA,
  getQualityDetails,
  getQualityMissing,
} from "@/utils/datasetQuality";
import { formatDateLong } from "@/utils/formatDate";
import { formatMetricValue } from "@/utils/formatNumber";
import TextLink from "@/components/Primitives/TextLink";
import { DescriptionWithReadMore } from "@/components/Shared/DescriptionWithReadMore";

interface DatasetDetailClientProps {
  dataset: Dataset;
}

export default function DatasetDetailClient({ dataset }: DatasetDetailClientProps) {
  const { i18n } = useTranslation("common");
  const { t: tds } = useTranslation("datasets");
  const { user, isAdmin } = useAuth();
  const { organizations } = useActiveOrganization();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [qualityExpanded, setQualityExpanded] = useState(false);
  const qualityExpandedRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // ADS 3.7 `CardAccordion` calls onExpanded/onCollapsed from its render body and
  // re-fires them on every render while open. Defer the state update so we never
  // setState during another component's render, and drop the repeat calls.
  const syncQualityExpanded = useCallback((next: boolean) => {
    if (qualityExpandedRef.current === next) return;
    qualityExpandedRef.current = next;
    queueMicrotask(() => setQualityExpanded(next));
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    isFollowing("datasets", dataset.id, user.id)
      .then((following) => { if (!cancelled) setIsFavorite(following); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [user,user?.id, dataset.id]);

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

  const ownerFullName = dataset.owner
    ? `${dataset.owner.first_name} ${dataset.owner.last_name}`.trim()
    : null;

  const qualityScore = calculateQualityScore(QUALITY_CRITERIA, dataset.quality);
  const qualityDetails = getQualityDetails(dataset.quality);
  const qualityMissing = getQualityMissing(dataset.quality);

  return (
    <main className="flex w-full flex-col items-center justify-center gap-64">
      {/* Breadcrumb */}
      <div className="container flex items-center justify-between py-64">
        <BreadcrumbDynamic
          darkMode={false}
          overrides={{ [dataset.slug]: dataset.title }}
        />
      </div>

      {/* Actions */}
      <div className="container flex items-center justify-end gap-16">
        {dataset.private && <Pill variant="warning">{tds("detail.draft")}</Pill>}
        {dataset.archived && <Pill variant="neutral">{tds("detail.archived")}</Pill>}
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
        <div className="xl:col-span-6">
          <div className="flex h-fit flex-col" ref={sidebarRef}>
            <div className="mb-16 flex flex-col gap-16 rounded-4 bg-[#F2F6FF] p-32">
              {dataset.organization?.logo ? (
                <div className="card-article-3_2-img flex h-48 w-fit items-center justify-center rounded-8 border-2 border-primary-300 py-8">
                  <img
                    src={dataset.organization.logo}
                    alt={dataset.organization.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : dataset.owner?.avatar_thumbnail ? (
                <div className="card-article-3_2-img flex h-48 w-fit items-center justify-center rounded-8 border-2 border-primary-300 py-8">
                  <img
                    src={dataset.owner.avatar_thumbnail}
                    alt={ownerFullName ?? tds("detail.authorAlt")}
                    className="max-h-full max-w-full rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex w-fit items-center justify-center rounded-8 border border-neutral-200 bg-neutral-100 px-12 py-12 text-neutral-400">
                  <Icon
                    name={dataset.owner ? "agora-line-user" : "agora-line-buildings"}
                    className="h-6 w-6"
                  />
                </div>
              )}

              <div className="space-y-16">
                <div className="mb-8 text-m-light text-neutral-900">
                  {dataset.organization ? (
                    <Link
                      href={`/organizations/${dataset.organization.slug}`}
                      className="hover:underline"
                    >
                      {dataset.organization.name}
                    </Link>
                  ) : dataset.owner ? (
                    /* LEDG-1861: user-authored datasets link to the public
                       profile instead of the broken "Organização Desconhecida"
                       fallback. */
                    <Link
                      href={`/users/${dataset.owner.slug}`}
                      className="hover:underline"
                    >
                      {ownerFullName}
                    </Link>
                  ) : (
                    tds("detail.noAuthor")
                  )}
                </div>
                <div className="text-sm mb-16 text-neutral-900">
                  <span className="text-m-semibold">{tds("detail.lastUpdate")}</span>{" "}
                  {formatDateLong(dataset.last_modified, i18n.language as "pt" | "en")}
                </div>
                {dataset.license && (
                  <div className="text-sm">
                    <TextLink
                      href={
                        dataset.license_url ||
                        `/licenses/${dataset.license}/`
                      }
                      target="_blank"
                    >
                      <span className="text-m-semibold">{tds("detail.license")}</span>{" "}
                      {dataset.license_title || dataset.license}
                    </TextLink>
                  </div>
                )}
                {dataset.contact_points && dataset.contact_points.length > 0 && (
                  <div className="flex flex-col gap-12 border-t border-neutral-200 pt-16">
                    {dataset.contact_points.map((cp) => (
                      <div key={cp.id} className="text-sm">
                        <div className="mb-4 text-m-semibold">
                          {tds(`contactRoles.${cp.role}`, { defaultValue: cp.role })}
                        </div>
                        <div className="mb-4 text-neutral-900">{cp.name}</div>
                        {cp.email && (
                          <TextLink href={`mailto:${cp.email}`} className="block break-all">
                            {cp.email}
                          </TextLink>
                        )}
                        {cp.contact_form && (
                          <TextLink href={cp.contact_form} target="_blank" className="block">
                            {tds("detail.contactForm")}
                          </TextLink>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="mb-16 grid grid-cols-2 gap-16">
              <div className="rounded-4 bg-[#F2F6FF] p-32">
                <div className="text-sm mb-8">{tds("detail.views")}</div>
                <div className="mb-8 text-l-semibold font-bold text-neutral-900">
                  {formatMetricValue(dataset.metrics?.views)}
                </div>
              </div>
              <div className="rounded-4 bg-[#F2F6FF] p-32">
                <div className="text-sm mb-8">{tds("detail.downloads")}</div>
                <div className="mb-8 text-l-semibold font-bold text-neutral-900">
                  {formatMetricValue(dataset.metrics?.resources_downloads)}
                </div>
              </div>
            </div>

            {/* Quality */}
            <CardExpandable
              variant="primary-100"
              cardTitle={tds("detail.quality.title")}
              cardHeadingLevel="h3"
              cardSubtitle={
                <div className="mt-8 flex flex-col gap-4">
                  <div
                    className={
                      qualityScore <= 45
                        ? "quality-progress-warning"
                        : qualityScore > 50
                          ? "quality-progress-success"
                          : ""
                    }
                  >
                    <ProgressBar value={qualityScore} max={100} hidePercentageValue={true} />
                  </div>
                  <div className="text-xs text-neutral-700">
                    {qualityScore}%
                    {qualityDetails.length > 0 &&
                      ` (${qualityDetails.map((key) => tds(`quality.${key}`)).join(", ")})`}
                  </div>
                </div>
              }
              accordionHeadingTitle={
                qualityExpanded ? tds("detail.quality.collapse") : tds("detail.quality.expand")
              }
              expanded={qualityExpanded}
              onExpanded={() => syncQualityExpanded(true)}
              onCollapsed={() => syncQualityExpanded(false)}
            >
              {qualityMissing.length > 0 && (
                <div className="flex flex-col gap-8">
                  {qualityMissing.map((key) => (
                    <div key={key} className="flex items-center gap-8">
                      <Icon
                        name="agora-line-alert-triangle"
                        className="h-20 w-20 fill-[#B06112]"
                      />
                      <span className="text-base text-neutral-900">
                        {tds("detail.quality.missing", { label: tds(`quality.${key}`) })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardExpandable>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <DatasetTabs dataset={dataset} />
    </main>
  );
}
