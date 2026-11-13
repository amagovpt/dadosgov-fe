"use client";

import type { ReactNode } from "react";
import { StepList } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import MarkDownRender from "@/components/Shared/MarkDownRender";
import StatusCard from "@/components/Primitives/StatusCard";
import type { UserGuideTask } from "@/service/types/user-guides";
import { UserGuideVideo, hasUserGuideMedia } from "./UserGuideVideo";

// MarkDownRender gives every paragraph a bottom margin; the blocks here own their spacing.
const MARKDOWN_BLOCK = "text-neutral-900 [&_p:last-child]:mb-0 [&_ul:last-child]:mb-0";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-16">
      <h3 className="text-l-bold text-primary-900">{title}</h3>
      {children}
    </section>
  );
}

/** Body of one task tab: Objetivo, O que fazer, Exemplo, Vídeo and Dica, each only when filled. */
export function UserGuideTaskContent({ task }: { task: UserGuideTask }) {
  const { t } = useTranslation("user-guides");

  return (
    // The DS tab panel already gives the content its top/bottom spacing, but no inline padding
    // on desktop.
    <div className="flex flex-col gap-40 px-32 xl:px-64">
      <h2 className="sr-only">{task.title}</h2>

      {task.audience && (
        <p className="text-s-regular text-neutral-700">
          {t("audience")}: <span className="text-s-bold text-primary-900">{task.audience}</span>
        </p>
      )}

      {task.objective && (
        <Block title={t("objective")}>
          <p className="text-m-regular text-neutral-900 whitespace-pre-line">{task.objective}</p>
        </Block>
      )}

      {task.steps.length > 0 && (
        <Block title={t("whatToDo")}>
          {/* StepList spreads its props over its own className, so it is styled from outside. */}
          <div className="[&_.agora-step-list_li]:after:bg-primary-900">
            <StepList>
              {task.steps.map((step, index) => (
                <li key={index}>
                  <div className={`pl-32 py-16 ${MARKDOWN_BLOCK}`}>
                    <MarkDownRender body={step} />
                  </div>
                </li>
              ))}
            </StepList>
          </div>
        </Block>
      )}

      {task.example && (
        <Block title={t("example")}>
          <div className={MARKDOWN_BLOCK}>
            <MarkDownRender body={task.example} />
          </div>
        </Block>
      )}

      {hasUserGuideMedia(task) && (
        <Block title={t("video")}>
          <UserGuideVideo task={task} />
        </Block>
      )}

      {task.tip && (
        // StatusCard ignores `className`, so the white background (as in the design) is
        // applied from a wrapper.
        <div className="[&_.agora-status-card]:bg-white!">
          <StatusCard
            variant="outline-informative"
            showIcon
            title={t("tip")}
            description={
              <div className={MARKDOWN_BLOCK}>
                <MarkDownRender body={task.tip} />
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
