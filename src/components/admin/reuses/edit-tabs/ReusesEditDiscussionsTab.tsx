import React from "react";
import { useTranslation } from "react-i18next";
import { CardNoResults, Icon, Pill } from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { Discussion } from "@/service/types/discussion";

type ReusesEditDiscussionsTabProps = {
  discussions: Discussion[];
  discussionsLoading: boolean;
  discussionsLoaded: boolean;
};

export default function ReusesEditDiscussionsTab({
  discussions,
  discussionsLoading,
  discussionsLoaded,
}: ReusesEditDiscussionsTabProps) {
  const { t } = useTranslation("admin-reuses");

  return (
    <div className="mt-24">
      {discussionsLoading && <p className="text-sm text-neutral-700">{t("edit.loading")}</p>}
      {discussionsLoaded && discussions.length === 0 && (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-chat" className="icon-xl h-12 w-12 text-primary-500" />}
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
            {discussions.map((discussion) => (
              <div key={discussion.id} className="rounded-8 bg-white p-32">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-neutral-900">{discussion.title}</h4>
                    <p className="mt-4 text-sm text-neutral-900">
                      <span className="font-medium text-primary-600">
                        {discussion.user.first_name} {discussion.user.last_name}
                      </span>
                      {` — ${t("edit.publishedOn")} `}
                      {format(new Date(discussion.created), "d 'de' MMMM 'de' yyyy", {
                        locale: pt,
                      })}
                    </p>
                  </div>
                  <Pill variant={discussion.closed ? "neutral" : "informative"}>
                    {discussion.closed ? t("edit.discussionClosed") : t("edit.discussionOpen")}
                  </Pill>
                </div>
                {discussion.discussion.length > 0 && (
                  <p className="mt-16 text-sm text-neutral-900">{discussion.discussion[0].content}</p>
                )}
                {discussion.discussion.length > 1 && (
                  <div className="mt-16 space-y-16 border-t border-neutral-200 pt-16">
                    {discussion.discussion.slice(1).map((message, index) => (
                      <div key={index} className="border-l-2 border-primary-600 pl-24">
                        <p className="text-sm text-neutral-900">
                          <span className="font-medium text-primary-600">
                            {message.posted_by.first_name} {message.posted_by.last_name}
                          </span>
                          {" — "}
                          {format(new Date(message.posted_on), "d 'de' MMMM 'de' yyyy", {
                            locale: pt,
                          })}
                        </p>
                        <p className="mt-4 text-sm text-neutral-900">{message.content}</p>
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
