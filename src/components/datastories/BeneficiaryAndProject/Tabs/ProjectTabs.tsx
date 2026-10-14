"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";
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
  // Bumped on every scroll request so the scroll effect also runs when the requested
  // tab is already the active one (e.g. `#beneficiarios`, the first tab).
  const [scrollRequest, setScrollRequest] = useState(0);
  const pendingScrollIdRef = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const tabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs]);

  // Selects the tab through the controlled `active` prop rather than clicking its header:
  // on the first render the ADS has not built the header buttons yet (it fills them from
  // state set in an effect), so a DOM click there finds nothing.
  const activateTabByHash = useCallback(
    (hash: string) => {
      const hashIndex = tabIds.indexOf(hash);
      if (hashIndex < 0) return;

      pendingScrollIdRef.current = hash;
      setActiveIndex(hashIndex);
      setScrollRequest((n) => n + 1);
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

    // The hash only exists in the browser, so it cannot seed the initial state without
    // a hydration mismatch; reading it once after mount is the intended sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [activeIndex, tabs, scrollRequest]);

  // The ADS Tabs re-announces the `active` tab through onTabActivation on mount and
  // whenever its children change, so an activation alone does not mean the user picked
  // a tab. Only a recent pointer/keyboard interaction on a tab header counts; otherwise
  // the scroll stays whatever a URL hash requested (or none, keeping the page in place).
  const lastHeaderInteractionRef = useRef(0);

  const markHeaderInteraction = (event: SyntheticEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[role="tab"], .tab-list-item')) {
      lastHeaderInteractionRef.current = Date.now();
    }
  };

  const handleTabClick = (index: number) => {
    const fromUser = Date.now() - lastHeaderInteractionRef.current < 1000;
    lastHeaderInteractionRef.current = 0;

    if (fromUser) {
      pendingScrollIdRef.current = tabs[index]?.id ?? null;
      setScrollRequest((n) => n + 1);
    }
    setActiveIndex(index);
  };

  return (
    <div
      ref={rootRef}
      onPointerDownCapture={markHeaderInteraction}
      onKeyDownCapture={markHeaderInteraction}
    >
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
