"use client";

import { useEffect, useState } from "react";
import { Tab, TabBody, TabHeader, Tabs } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import Button from "@/components/Primitives/Button";
import StatusCard from "@/components/Primitives/StatusCard";
import Anchor from "@/components/Shared/Anchor";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { LocalizedLink } from "@/components/Shared/LocalizedLink";
import MarkDownRender from "@/components/Shared/MarkDownRender";
import type { UserGuide } from "@/service/types/user-guides";
import { getAssets } from "@/utils/getAssets";
import { UserGuideCard } from "./UserGuideCard";
import { UserGuideTaskContent } from "./UserGuideTaskContent";

const MARKDOWN_BLOCK = "[&_p:last-child]:mb-0";

/** Index of the task named by the URL hash (`#encontrar-dados`), or the first task. */
function taskIndexFromHash(guide: UserGuide): number {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  return Math.max(0, guide.tasks.findIndex((task) => task.id === id));
}

export function UserGuideDetailClient({ guide }: { guide: UserGuide }) {
  const { t } = useTranslation("user-guides");
  const pdf = guide.pdf[0];

  // The DS Tabs only read `active` on mount, so the hash-selected tab is applied by remounting.
  const [initialTask, setInitialTask] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialTask(taskIndexFromHash(guide));
  }, [guide]);

  const onTaskActivation = (index: number) => {
    const task = guide.tasks[index];
    if (task) window.history.replaceState(null, "", `#${task.id}`);
  };

  return (
    <main className="flex w-full flex-col items-center overflow-x-clip">
      <section className="container flex flex-col gap-32 pt-64 pb-64">
        <BreadcrumbDynamic darkMode={false} currentLabel={guide.title} />
        <div className="flex flex-col gap-16 md:w-1/2">
          <p className="text-l-regular text-primary-900">{t("eyebrow")}</p>
          <h1 className="text-3xl-bold text-primary-900">{guide.title}</h1>
          {guide.description && (
            <div className={`text-primary-900 ${MARKDOWN_BLOCK}`}>
              <MarkDownRender body={guide.description} />
            </div>
          )}
          {guide.requirementNote && (
            <div className={`text-neutral-900 ${MARKDOWN_BLOCK}`}>
              <MarkDownRender body={guide.requirementNote} />
            </div>
          )}
        </div>

        {guide.status === "unavailable" && (
          <StatusCard
            variant="warning"
            showIcon
            className="md:w-2/3"
            title={t("unavailableTitle")}
            description={
              guide.statusNotice ? (
                <div className={MARKDOWN_BLOCK}>
                  <MarkDownRender body={guide.statusNotice} />
                </div>
              ) : undefined
            }
          />
        )}

        {pdf && (
          <a
            href={getAssets(pdf.slug || pdf.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit"
          >
            <Button
              tabIndex={-1}
              appearance="solid"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-download"
              trailingIconHover="agora-solid-download"
            >
              {t("downloadGuide")}
            </Button>
          </a>
        )}
      </section>

      {guide.tasks.length > 0 && (
        // The task panel bleeds to the right edge of the viewport, as in the design: a spread
        // shadow in the panel colour, clipped so it only extends rightwards.
        <section
          className="container pb-80 [&_.desktop_.tab-panel]:shadow-[0_0_0_100vmax_var(--color-primary-100)] [&_.desktop_.tab-panel]:[clip-path:inset(0_-100vmax_0_0)]"
          aria-label={t("tasksLabel")}
        >
          <Tabs
            key={initialTask}
            vertically
            currentType="primary"
            onTabActivation={onTaskActivation}
          >
            {guide.tasks.map((task, index) => (
              <Tab key={task.id} active={index === initialTask}>
                <TabHeader>{task.title}</TabHeader>
                <TabBody>
                  <UserGuideTaskContent task={task} />
                </TabBody>
              </Tab>
            ))}
          </Tabs>
        </section>
      )}

      {guide.relatedGuides.length > 0 && (
        <section className="container flex flex-col gap-32 pb-64">
          <h2 className="text-xl-bold text-primary-900">{t("relatedGuides")}</h2>
          <ul className="grid grid-cols-1 lg:grid-cols-12 gap-32">
            {guide.relatedGuides.map((related) => (
              <li key={related.id} className="lg:col-span-8">
                <UserGuideCard guide={related} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {guide.usefulResources.length > 0 && (
        <section className="container flex flex-col gap-24 pb-96">
          <h2 className="text-xl-bold text-primary-900">{t("usefulResources")}</h2>
          <ul className="flex flex-col gap-8">
            {guide.usefulResources.map((resource) => {
              const isExternal = /^https?:\/\//.test(resource.url);
              return (
                <li key={resource.url}>
                  {isExternal ? (
                    <Anchor
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      appearance="link"
                      hasIcon
                      trailingIcon="agora-line-external-link"
                    >
                      {resource.label}
                    </Anchor>
                  ) : (
                    <LocalizedLink
                      href={resource.url}
                      className="text-m-regular text-primary-600 underline hover:text-primary-700"
                    >
                      {resource.label}
                    </LocalizedLink>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
