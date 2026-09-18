"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Avatar, Icon, type HeaderElement } from "@ama-pt/agora-design-system";
import { useAuth } from "@/context/AuthContext";
import {
  useActiveProfile,
  isSameProfile,
  type ActiveProfile,
} from "@/context/ActiveProfileContext";

interface ProfileOption {
  profile: ActiveProfile;
  label: string;
  href: string;
  avatarType: "image" | "initials" | "icon";
  srcPath: string;
}

const BAND_CLASSES =
  "flex w-full cursor-pointer items-center gap-8 bg-primary-50 px-24 py-16 " +
  "text-left text-base leading-normal text-primary-600";

const OPTION_CLASSES =
  "flex w-full cursor-pointer items-center gap-16 border-b border-neutral-300 " +
  "px-24 py-16 text-left hover:bg-neutral-50";

const RADIO_CLASSES = "flex size-20 shrink-0 items-center justify-center rounded-full border-2";

const RADIO_CHECKED_CLASSES =
  "border-primary-600 after:size-[10px] after:rounded-full after:bg-primary-600 " +
  "after:content-['']";

export function AdminProfileSwitcher({
  headerRef,
  headerHandleRef,
}: {
  headerRef: RefObject<HTMLDivElement | null>;
  headerHandleRef: RefObject<HeaderElement | null>;
}) {
  const { user, isAdmin } = useAuth();
  const { activeProfile, setActiveProfile } = useActiveProfile();
  const { t } = useTranslation("common");
  const router = useRouter();
  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const initials = user
    ? `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()
    : "";

  const options = useMemo<ProfileOption[]>(() => {
    if (!user) return [];
    const list: ProfileOption[] = [
      {
        profile: { type: "personal" },
        label: `${user.first_name} ${user.last_name}`,
        href: "/admin/me/datasets",
        avatarType: user.avatar_thumbnail ? "image" : initials ? "initials" : "icon",
        srcPath: user.avatar_thumbnail || initials || "agora-line-user",
      },
      ...(user.organizations ?? []).map(
        (org): ProfileOption => ({
          profile: { type: "organization", orgId: org.id },
          label: org.name,
          href: "/admin/org/datasets",
          avatarType: org.logo_thumbnail ? "image" : "icon",
          srcPath: org.logo_thumbnail || "agora-line-briefcase",
        })
      ),
    ];
    if (isAdmin) {
      list.push({
        profile: { type: "system" },
        label: t("header.administratorProfile"),
        href: "/admin/system/datasets",
        avatarType: "icon",
        srcPath: "agora-line-buildings",
      });
    }
    return list;
  }, [user, isAdmin, initials, t]);

  useEffect(() => {
    const drawerHeader = headerRef.current?.querySelector(".agora-drawer .authenticated-header");
    if (!drawerHeader) return;

    const container = document.createElement("div");
    container.className = "admin-profile-switcher";
    drawerHeader.insertAdjacentElement("afterend", container);

    queueMicrotask(() => {
      setPortalNode(container);
    });

    return () => {
      container.remove();
      setPortalNode(null);
    };
  }, [headerRef]);

  useEffect(() => {
    const dialog = headerRef.current
      ?.querySelector(".authenticated-header")
      ?.closest(".agora-dialog");
    if (!dialog) return;

    const observer = new MutationObserver(() => {
      if (dialog.classList.contains("closed")) setIsSwitching(false);
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [headerRef]);

  const selectProfile = (option: ProfileOption) => {
    setActiveProfile(option.profile);
    setIsSwitching(false);
    headerHandleRef.current?.closeAll?.();
    router.push(option.href);
  };

  if (!portalNode || options.length <= 1) return null;

  return createPortal(
    <div data-open={isSwitching}>
      {isSwitching ? (
        <>
          <button type="button" className={BAND_CLASSES} onClick={() => setIsSwitching(false)}>
            <Icon
              name="agora-line-chevron-left"
              dimensions="s"
              className="shrink-0 fill-current"
              aria-hidden
            />
            <span>{t("header.back")}</span>
          </button>
          <ul className="m-0 list-none p-0" role="radiogroup">
            {options.map((option) => {
              const isActive = isSameProfile(option.profile, activeProfile);
              return (
                <li key={option.href + option.label}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={OPTION_CLASSES}
                    onClick={() => selectProfile(option)}
                  >
                    <Avatar
                      avatarType={option.avatarType}
                      srcPath={option.srcPath}
                      alt=""
                      className="shrink-0"
                    />
                    <span
                      className={`flex-1 text-m-regular ${isActive ? "text-primary-600" : "text-neutral-900"}`}
                    >
                      {option.label}
                    </span>
                    <span
                      aria-hidden
                      className={`${RADIO_CLASSES} ${
                        isActive ? RADIO_CHECKED_CLASSES : "border-neutral-700"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <button type="button" className={BAND_CLASSES} onClick={() => setIsSwitching(true)}>
          <span className="flex-1 text-left">
            {t("header.selectProfile", { count: options.length })}
          </span>
          <Icon
            name="agora-line-chevron-right"
            dimensions="s"
            className="shrink-0 fill-current"
            aria-hidden
          />
        </button>
      )}
    </div>,
    portalNode
  );
}
