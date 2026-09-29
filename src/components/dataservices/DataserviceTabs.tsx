"use client";

import { Suspense, use, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, Tab, TabHeader } from "@ama-pt/agora-design-system";
import { TabBodyWrapper } from "@/components/Shared/Wrappers/TabBodyWrapper";
import { DiscussionSection } from "@/components/discussions/DiscussionSection";
import type { DataserviceDiscussionsResult } from "@/service/types/dataservice/detail";

function StreamedDiscussions({ id, discussions, onCountChange }: {
  id: string;
  discussions: Promise<DataserviceDiscussionsResult>;
  onCountChange: (count: number) => void;
}) {
  const result = use(discussions);
  const { t } = useTranslation("dataservices");
  if (!result) return <p role="alert">{t("tabs.discussionsError")}</p>;
  return <DiscussionSection key={id} entityId={id} entityClass="Dataservice" initialData={result} onCountChange={onCountChange} />;
}

export function DataserviceTabs({ id, discussionCount: initialCount, discussions, information }: {
  id: string;
  discussionCount: number;
  discussions: Promise<DataserviceDiscussionsResult>;
  information: ReactNode;
}) {
  const { t } = useTranslation("dataservices");
  const [discussionCount, setDiscussionCount] = useState(initialCount);
  return (
    <div className="w-full">
      <Tabs>
        <Tab>
          <TabHeader>{t("tabs.info")}</TabHeader>
          <TabBodyWrapper>{information}</TabBodyWrapper>
        </Tab>
        <Tab>
          <TabHeader>{t("tabs.discussions", { count: discussionCount })}</TabHeader>
          <TabBodyWrapper>
            <div data-testid="dataservice-discussions">
              <Suspense fallback={<p role="status">{t("tabs.loadingDiscussions")}</p>}>
                <StreamedDiscussions id={id} discussions={discussions} onCountChange={setDiscussionCount} />
              </Suspense>
            </div>
          </TabBodyWrapper>
        </Tab>
      </Tabs>
    </div>
  );
}
