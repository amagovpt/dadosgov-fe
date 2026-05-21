import React from "react";
import { Avatar, CardNoResults, Icon } from "@ama-pt/agora-design-system";
import type { Activity } from '@/service/types/catalog';

type ReusesEditActivitiesTabProps = {
  activities: Activity[];
  activitiesLoading: boolean;
  activitiesLoaded: boolean;
  translateActivityLabel: (label: string) => string;
};

export default function ReusesEditActivitiesTab({
  activities,
  activitiesLoading,
  activitiesLoaded,
  translateActivityLabel,
}: ReusesEditActivitiesTabProps) {
  return (
    <div className="mt-24">
      {activitiesLoading && <p className="text-neutral-700 text-sm">A carregar...</p>}
      {activitiesLoaded && activities.length === 0 && (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-time" className="w-12 h-12 text-primary-500 icon-xl" />}
          title="Sem atividades"
          description="Ainda não existem atividades registadas nesta reutilização."
          hasAnchor={false}
        />
      )}
      {activitiesLoaded && activities.length > 0 && (
        <>
          <h2 className="font-medium text-neutral-900 text-base mb-16">
            {activities.length} ATIVIDADES
          </h2>
          <div className="flex flex-col gap-12">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-12 p-12 bg-neutral-50 rounded-lg"
              >
                <Avatar
                  avatarType={activity.actor?.avatar_thumbnail ? "image" : "initials"}
                  srcPath={
                    (activity.actor?.avatar_thumbnail ||
                      `${(activity.actor?.first_name || "")[0] || ""}${(activity.actor?.last_name || "")[0] || ""}`.toUpperCase()) as unknown as undefined
                  }
                  alt={`${activity.actor?.first_name || ""} ${activity.actor?.last_name || ""}`}
                />
                <div>
                  <p className="text-sm text-neutral-900">
                    <a
                      href={`/pages/admin/users/${activity.actor?.id}`}
                      className="text-primary-600 underline"
                    >
                      {activity.actor?.first_name} {activity.actor?.last_name}
                    </a>{" "}
                    {translateActivityLabel(activity.label)}
                  </p>
                  <p className="text-xs text-neutral-600 mt-4">
                    {new Date(activity.created_at).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
