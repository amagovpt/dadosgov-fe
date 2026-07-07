"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, CardNoResults, Icon } from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { Activity } from "@/service/types/catalog";

type UserAdminActivitiesTabProps = {
  activities: Activity[];
  isLoading: boolean;
  activityPage: number;
  totalActivityPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

function groupActivitiesByMonth(activities: Activity[]) {
  const groups: Record<string, Activity[]> = {};
  activities.forEach((activity) => {
    const key = format(new Date(activity.created_at), "MMMM 'de' yyyy", { locale: pt });
    if (!groups[key]) groups[key] = [];
    groups[key].push(activity);
  });
  return groups;
}

export default function UserAdminActivitiesTab({
  activities,
  isLoading,
  activityPage,
  totalActivityPages,
  onPreviousPage,
  onNextPage,
}: UserAdminActivitiesTabProps) {
  const { t } = useTranslation("admin-users");

  return (
    <div className="mt-24">
      {isLoading ? (
        <p className="text-neutral-900 text-base">{t("activities.loading")}</p>
      ) : activities.length === 0 ? (
        <CardNoResults
          className="admin-page__empty"
          position="center"
          icon={<Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />}
          title={t("activities.emptyTitle")}
          description={t("activities.emptyDescription")}
          hasAnchor={false}
        />
      ) : (
        <div className="space-y-32">
          {Object.entries(groupActivitiesByMonth(activities)).map(([month, monthActivities]) => (
            <div key={month}>
              <h3 className="text-neutral-900 text-sm font-medium mb-16">{month}</h3>
              <div className="relative ml-4 border-l-2 border-neutral-200">
                {monthActivities.map((activity, index) => (
                  <div key={index} className="relative ml-16 flex items-start gap-16 pb-16">
                    <div className="absolute -left-[25px] top-1 h-8 w-8 rounded-full bg-neutral-300" />
                    <div className="flex flex-1 items-start justify-between">
                      <div>
                        <span className="text-sm">
                          <Icon
                            name="agora-line-user"
                            className="w-4 h-4 inline text-primary-600 mr-4"
                          />
                          <span className="text-primary-600 font-medium">
                            {activity.actor.first_name} {activity.actor.last_name}
                          </span>
                          {" \u25BA "}
                          <span className="text-neutral-900">{activity.label}</span>
                        </span>
                        {activity.related_to_url && (
                          <div>
                            <a
                              href={activity.related_to_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 text-sm underline"
                            >
                              {activity.related_to}
                              <Icon
                                name="agora-line-external-link"
                                className="w-3 h-3 inline ml-4"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                      <span className="text-neutral-900 text-sm whitespace-nowrap ml-16">
                        {format(new Date(activity.created_at), "d 'de' MMMM 'de' yyyy", {
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
            <div className="mt-32 flex items-center justify-center gap-8">
              <Button
                variant="primary"
                appearance="outline"
                onClick={onPreviousPage}
                disabled={activityPage === 1}
              >
                {t("activities.previous")}
              </Button>
              <span className="text-neutral-900 text-sm">
                {t("activities.page", { page: activityPage, total: totalActivityPages })}
              </span>
              <Button
                variant="primary"
                appearance="outline"
                onClick={onNextPage}
                disabled={activityPage === totalActivityPages}
              >
                {t("activities.next")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
