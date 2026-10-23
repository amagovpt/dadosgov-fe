"use client";

import { Tabs } from "@/components/Shared/Tabs";
import {
  Children,
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TabSectionLikeProps = {
  active?: boolean | "true" | "false";
  id?: string;
  "data-tab-id"?: string;
};

function normalizeHash(value: string) {
  return decodeURIComponent(value)
    .replace(/^#/, "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isTruthyBooleanProp(value: unknown) {
  return value === true || value === "true";
}

function getTabHashId(tab: ReactElement<TabSectionLikeProps>) {
  const dataTabId = tab.props["data-tab-id"];
  if (typeof dataTabId === "string") return dataTabId;
  if (typeof tab.props.id === "string") return tab.props.id;
  return "";
}

function updateUrlHashWithoutScroll(hashId: string) {
  if (!hashId) return;

  const normalizedCurrentHash = normalizeHash(window.location.hash);
  if (normalizedCurrentHash === normalizeHash(hashId)) return;

  const url = `${window.location.pathname}${window.location.search}#${encodeURIComponent(hashId)}`;
  window.history.replaceState(window.history.state, "", url);
}

function scheduleScrollToElement(getElement: () => HTMLElement | null) {
  const scroll = () => {
    getElement()?.scrollIntoView({ behavior: "auto", block: "start" });
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(scroll);
  });

  window.setTimeout(scroll, 120);
}

export default function ProjectTabsHashSync({ children }: { children: ReactNode }) {
  const tabsRootRef = useRef<HTMLDivElement>(null);

  const tabChildren = useMemo(
    () =>
      Children.toArray(children).filter((child): child is ReactElement<TabSectionLikeProps> =>
        isValidElement(child)
      ),
    [children]
  );

  const defaultActiveIndex = useMemo(() => {
    const activeIndex = tabChildren.findIndex((child) => isTruthyBooleanProp(child.props.active));
    return activeIndex >= 0 ? activeIndex : 0;
  }, [tabChildren]);

  const [selectedIndex, setActiveIndex] = useState(defaultActiveIndex);
  const activeIndex = selectedIndex < tabChildren.length ? selectedIndex : defaultActiveIndex;

  useEffect(() => {
    if (tabChildren.length === 0) return;

    const getTabIndexFromHash = (normalizedHash: string) =>
      tabChildren.findIndex((tab) => normalizeHash(getTabHashId(tab)) === normalizedHash);

    const syncWithHash = (forcedHash?: string) => {
      const normalizedHash = forcedHash ?? normalizeHash(window.location.hash);
      if (!normalizedHash) return;

      const hashIndex = getTabIndexFromHash(normalizedHash);
      if (hashIndex >= 0) {
        setActiveIndex(hashIndex);
        scheduleScrollToElement(() => tabsRootRef.current);
      }
    };

    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.pathname !== window.location.pathname) return;
      if (url.search !== window.location.search) return;

      const clickedHash = normalizeHash(url.hash);
      if (!clickedHash) return;

      const clickedHashIndex = getTabIndexFromHash(clickedHash);
      if (clickedHashIndex < 0) return;

      const currentHash = normalizeHash(window.location.hash);
      if (clickedHash !== currentHash) return;

      event.preventDefault();
      syncWithHash(clickedHash);
    };

    const handleHashChange = () => {
      syncWithHash();
    };

    const handlePageShow = () => {
      syncWithHash();
    };

    const handleWindowFocus = () => {
      syncWithHash();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncWithHash();
      }
    };

    const syncFromCurrentHash = () => {
      syncWithHash();
    };

    syncFromCurrentHash();
    requestAnimationFrame(syncFromCurrentHash);
    const syncTimeoutA = window.setTimeout(syncFromCurrentHash, 120);
    const syncTimeoutB = window.setTimeout(syncFromCurrentHash, 320);

    window.addEventListener("load", syncFromCurrentHash);
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("click", handleAnchorClick);

    return () => {
      window.clearTimeout(syncTimeoutA);
      window.clearTimeout(syncTimeoutB);
      window.removeEventListener("load", syncFromCurrentHash);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("click", handleAnchorClick);
    };
  }, [tabChildren]);

  const tabsWithActiveState = useMemo(
    () => tabChildren.map((tab, index) => cloneElement(tab, { active: index === activeIndex })),
    [activeIndex, tabChildren]
  );

  return (
    <div ref={tabsRootRef} style={{ scrollMarginTop: "167px" }}>
      <Tabs.Root
        onTabActivation={(index) => {
          if (index === activeIndex || !tabChildren[index]) return;

          setActiveIndex(index);
          updateUrlHashWithoutScroll(getTabHashId(tabChildren[index]));
        }}
      >
        {tabsWithActiveState}
      </Tabs.Root>
    </div>
  );
}
