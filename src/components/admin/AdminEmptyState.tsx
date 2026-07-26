"use client";

import { CardNoResults, IconName } from "@ama-pt/agora-design-system";
import AppIcon from "../Primitives/AppIcon";
import Button from "../Primitives/Button";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export interface AdminEmptyStateI {
  icon?: IconName;
  title?: string;
  description?: string;
  createUrl?: string;
  createTitle?: string;
}

export default function AdminEmptyState({
  icon = "agora-line-search",
  title,
  description,
  createUrl,
  createTitle,
}: AdminEmptyStateI) {
  const { t } = useTranslation("admin-common");
  const routerNav = useRouter();
  const emptyTitle = title ?? t("emptyState.title");
  const emptyDescription = description ?? t("emptyState.description");
  const actionTitle = createTitle ?? t("emptyState.create");

  const handleNavigation = useCallback(() => {
    if (createUrl) routerNav.push(createUrl);
  }, [createUrl, routerNav]);

  return (
    <>
      <div className="admin-page__body">
        <div className="admin-page__content">
          <CardNoResults
            className="admin-page__empty"
            position="center"
            icon={<AppIcon name={icon} className="icon-xl h-12 w-12 text-primary-500" />}
            title={emptyTitle}
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
