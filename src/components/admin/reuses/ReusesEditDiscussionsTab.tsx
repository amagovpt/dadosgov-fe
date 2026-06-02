import React from "react";
import { CardNoResults, Icon, Pill } from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { Discussion } from "@/types/api";

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
  return (
    <div className="mt-24">
      {discussionsLoading && <p className="text-neutral-700 text-sm">A carregar...</p>}
      {discussionsLoaded && discussions.length === 0 && (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-chat" className="w-12 h-12 text-primary-500 icon-xl" />}
          title="Sem discussões"
          description="Ainda não existem discussões nesta reutilização."
          hasAnchor={false}
        />
      )}
      {discussionsLoaded && discussions.length > 0 && (
        <div>
          <h2 className="font-medium text-neutral-900 text-base mb-16">
            {discussions.length} {discussions.length === 1 ? "DISCUSSÃO" : "DISCUSSÕES"}
          </h2>
          <div className="space-y-16">
            {discussions.map((discussion) => (
              <div key={discussion.id} className="bg-white rounded-8 p-32">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-neutral-900 text-base">{discussion.title}</h4>
                    <p className="text-sm text-neutral-900 mt-4">
                      <span className="text-primary-600 font-medium">
                        {discussion.user.first_name} {discussion.user.last_name}
                      </span>
                      {" — Publicado em "}
                      {format(new Date(discussion.created), "d 'de' MMMM 'de' yyyy", {
                        locale: pt,
                      })}
                    </p>
                  </div>
                  <Pill variant={discussion.closed ? "neutral" : "informative"}>
                    {discussion.closed ? "Fechada" : "Aberta"}
                  </Pill>
                </div>
                {discussion.discussion.length > 0 && (
                  <p className="text-neutral-900 text-sm mt-16">
                    {discussion.discussion[0].content}
                  </p>
                )}
                {discussion.discussion.length > 1 && (
                  <div className="mt-16 space-y-16 border-t border-neutral-200 pt-16">
                    {discussion.discussion.slice(1).map((message, index) => (
                      <div key={index} className="border-l-2 border-primary-600 pl-24">
                        <p className="text-sm text-neutral-900">
                          <span className="text-primary-600 font-medium">
                            {message.posted_by.first_name} {message.posted_by.last_name}
                          </span>
                          {" — "}
                          {format(new Date(message.posted_on), "d 'de' MMMM 'de' yyyy", {
                            locale: pt,
                          })}
                        </p>
                        <p className="text-neutral-900 text-sm mt-4">{message.content}</p>
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
