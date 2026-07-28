import React from "react";
import { useTranslation } from "react-i18next";
import { CardNoResults, Icon, Pill } from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { Discussion } from "@/service/types/discussion";

type DatasetsEditDiscussionsTabProps = {
  discussionsLoading: boolean;
  discussionsLoaded: boolean;
  discussions: Discussion[];
};

export default function DatasetsEditDiscussionsTab({
  discussionsLoading,
  discussionsLoaded,
  discussions,
}: DatasetsEditDiscussionsTabProps) {
  const { t } = useTranslation("admin-datasets");

  return (
    <div className="mt-24">
      {discussionsLoading && <p className="text-neutral-700 text-sm">{t("edit.loading")}</p>}
      {discussionsLoaded && discussions.length === 0 && (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-chat" className="w-12 h-12 text-primary-500 icon-xl" />}
          title={t("edit.discussionsEmptyTitle")}
          description={t("edit.discussionsEmptyDescription")}
          hasAnchor={false}
        />
      )}
      {discussionsLoaded && discussions.length > 0 && (
        <div>
          <h2 className="mb-16 text-base font-medium text-neutral-900">
            {discussions.length}{" "}
            {discussions.length === 1 ? t("edit.discussionSingle") : t("edit.discussionPlural")}
          </h2>
          <div className="space-y-16">
            {discussions.map((disc) => (
              <div key={disc.id} className="rounded-8 bg-white p-32">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-neutral-900">{disc.title}</h4>
                    <p className="mt-4 text-sm text-neutral-900">
                      <span className="font-medium text-primary-600">
                        {disc.user.first_name} {disc.user.last_name}
                      </span>
                      {` — ${t("edit.publishedOn")} `}
                      {format(new Date(disc.created), "d 'de' MMMM 'de' yyyy", {
                        locale: pt,
                      })}
                    </p>
                  </div>
                  <Pill variant={disc.closed ? "neutral" : "informative"}>
                    {disc.closed ? t("edit.discussionClosed") : t("edit.discussionOpen")}
                  </Pill>
                </div>
                {disc.discussion.length > 0 && (
                  <p className="mt-16 text-sm text-neutral-900">{disc.discussion[0].content}</p>
                )}
                {disc.discussion.length > 1 && (
                  <div className="mt-16 space-y-16 border-t border-neutral-200 pt-16">
                    {disc.discussion.slice(1).map((msg, idx) => (
                      <div key={idx} className="border-l-2 border-primary-600 pl-24">
                        <p className="text-sm text-neutral-900">
                          <span className="font-medium text-primary-600">
                            {msg.posted_by.first_name} {msg.posted_by.last_name}
                          </span>
                          {" — "}
                          {format(new Date(msg.posted_on), "d 'de' MMMM 'de' yyyy", {
                            locale: pt,
                          })}
                        </p>
                        <p className="mt-4 text-sm text-neutral-900">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
