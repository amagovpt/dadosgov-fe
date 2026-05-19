import React from "react";
import { Avatar, CardNoResults, Icon } from "@ama-pt/agora-design-system";
import type { Activity } from "@/types/api";
import { AppLink } from "@/components/Primitives/AppLink";

type DatasetsEditActivitiesTabProps = {
  activitiesLoading: boolean;
  activitiesLoaded: boolean;
  activities: Activity[];
  translateActivityLabel: (label: string) => string;
};

export default function DatasetsEditActivitiesTab({
  activitiesLoading,
  activitiesLoaded,
  activities,
  translateActivityLabel,
}: DatasetsEditActivitiesTabProps) {
  return (
    <div className="mt-24">
      {activitiesLoading && <p className="text-sm text-neutral-700">A carregar...</p>}
      {activitiesLoaded && activities.length === 0 && (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-time" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem atividades"
          description="Ainda não existem atividades registadas neste conjunto de dados."
          hasAnchor={false}
        />
      )}
      {activitiesLoaded && activities.length > 0 && (
        <>
          <h2 className="mb-16 text-base font-medium text-neutral-900">
            {activities.length} ATIVIDADES
          </h2>
          <div className="flex flex-col gap-12">
            {activities.map((activity, index) => (
              <div key={index} className="rounded-lg flex items-start gap-12 bg-neutral-50 p-12">
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
                    <AppLink href={`/pages/admin/users/${activity.actor?.id}`}>
                      {activity.actor?.first_name} {activity.actor?.last_name}
                    </AppLink>{" "}
                    {translateActivityLabel(activity.label)}
                  </p>
                  <p className="text-xs mt-4 text-neutral-600">
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
