"use client";

import { CardNoResults, IconName } from "@ama-pt/agora-design-system";
import AppIcon from "../Primitives/AppIcon";
import Button from "../Primitives/Button";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export interface AdminEmptyStateI {
  icon: IconName;
  title?: string;
  description?: string;
  createUrl?: string;
  createTitle?: string;
}

export default function AdminEmptyState({
  icon,
  title = "Sem publicações",
  description = "Ainda não publicou uma API.",
  createUrl,
  createTitle = "Publique no portal",
}: AdminEmptyStateI) {
  const routerNav = useRouter();

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
            title={title}
            description={description}
            hasAnchor={false}
            extraDescription={
              createUrl && (
                <div className="mt-24">
                  <Button variant="primary" appearance="outline" onClick={() => handleNavigation()}>
                    {createTitle}
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
