"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Tab, TabBody, TabHeader, Tabs } from "@ama-pt/agora-design-system";

type ProjectTabItem = {
  id: string;
  title: string;
  body: ReactNode;
  scrollTargetId?: string;
};

type ProjectTabsProps = {
  tabs: ProjectTabItem[];
};

export default function ProjectTabs({ tabs }: ProjectTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pendingScrollIdRef = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const tabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs]);

  const activateTabByHash = useCallback(
    (hash: string) => {
      const hashIndex = tabIds.indexOf(hash);
      if (hashIndex < 0) return;

      pendingScrollIdRef.current = hash;
      const tabButtons = rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabButtons?.[hashIndex]?.click();
    },
    [tabIds]
  );

  const scrollTargetIntoView = (targetId: string, currentId: string) => {
    const target = document.getElementById(targetId);
    const visible = target && target.getBoundingClientRect().height > 0;

    if (!visible) {
      return false;
    }

    const tabListHeight =
      rootRef.current?.querySelector('[role="tablist"]')?.getBoundingClientRect().height ?? 0;
    const offset = Math.ceil(tabListHeight + 64);

    const top = target.getBoundingClientRect().top + window.scrollY - offset;

    window.history.replaceState(null, "", `#${currentId}`);
    window.scrollTo({
      top,
      behavior: "smooth",
    });

    return true;
  };

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    activateTabByHash(hash);
  }, [activateTabByHash]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;

      activateTabByHash(hash);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [activateTabByHash]);

  useEffect(() => {
    const currentTab = tabs[activeIndex];
    const currentId = currentTab?.id;
    if (!currentId) return;

    const pendingScrollId = pendingScrollIdRef.current;
    if (!pendingScrollId) return;

    const targetId = currentTab.scrollTargetId ?? pendingScrollId ?? currentId;
    let attempts = 0;
    const maxAttempts = 40;
    const intervalId = window.setInterval(() => {
      if (!scrollTargetIntoView(targetId, currentId)) {
        attempts += 1;
        if (attempts >= maxAttempts) {
          window.clearInterval(intervalId);
          pendingScrollIdRef.current = null;
        }
        return;
      }

      window.clearInterval(intervalId);
      pendingScrollIdRef.current = null;
    }, 50);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, tabs]);

  const handleTabClick = (index: number) => {
    pendingScrollIdRef.current = tabs[index]?.id ?? null;
    setActiveIndex(index);
  };

  return (
    <div ref={rootRef}>
      <Tabs onTabActivation={handleTabClick}>
        {tabs.map((tab, index) => (
          <Tab key={tab.id} active={index === activeIndex}>
            <TabHeader>{tab.title}</TabHeader>
            <TabBody focusableContent>
              {tab.scrollTargetId ? tab.body : <div id={tab.id}>{tab.body}</div>}
            </TabBody>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}
