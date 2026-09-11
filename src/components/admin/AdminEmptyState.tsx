"use client";

import { CardNoResults, IconName } from "@ama-pt/agora-design-system";
import type { ReactNode } from "react";
import AppIcon from "../Primitives/AppIcon";
import Button from "../Primitives/Button";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { FoListPageNoResults } from "@/service/types/shared";

export interface AdminEmptyStateI {
  icon?: IconName;
  illustration?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: string;
  noResults?: FoListPageNoResults;
  createUrl?: string;
  createTitle?: string;
}

export default function AdminEmptyState(props: AdminEmptyStateI) {
  const { icon, illustration, title, subtitle, description, noResults, createUrl, createTitle } =
    props;
  const { t } = useTranslation("admin-common");
  const routerNav = useRouter();
  const handleNavigation = useCallback(() => {
    if (createUrl) routerNav.push(createUrl);
  }, [createUrl, routerNav]);

  if ("noResults" in props && !noResults) return null;

  const emptyIcon = (noResults?.icon || icon || "agora-line-search") as IconName;
  const emptyTitle = noResults?.title ?? title ?? t("emptyState.title");
  const emptySubtitle = noResults?.subtitle ?? subtitle;
  const emptyDescription = noResults?.description ?? description ?? t("emptyState.description");
  const actionTitle = createTitle ?? t("emptyState.create");

  return (
    <>
      <div className="admin-page__body">
        <div className="admin-page__content">
          <CardNoResults
            className="admin-page__empty"
            position="center"
            icon={illustration ?? <AppIcon name={emptyIcon} className="icon-xl h-12 w-12 text-primary-500" />}
            title={emptyTitle}
            subtitle={emptySubtitle}
            description={emptyDescription}
            hasAnchor={false}
            extraDescription={
              createUrl && (
                <div className="mt-24">
                  <Button variant="primary" appearance="outline" onClick={() => handleNavigation()}>
                    {actionTitle}
                  </Button>
                </div>
              )
            }
          />
        </div>
      </div>
    </>
  );
}
