"use client";

import { usePathname, useRouter } from "next/navigation";
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
import { localizeHref } from "@/utils/localizeHref";
import { splitLocale } from "@/utils/stripLocale";
import { getProfileDetails, type ProfileDetails } from "@/utils/profileDetails";

interface ProfileOption extends ProfileDetails {
  profile: ActiveProfile;
}

const BAND_CLASSES =
  "flex min-h-60 w-full cursor-pointer items-center gap-8 bg-primary-200 p-16 " +
  "text-left text-base leading-normal text-primary-600";

const OPTION_CLASSES =
  "flex w-full cursor-pointer items-center gap-16 border-b border-neutral-300 " +
  " p-16 text-left hover:bg-neutral-50";

const RADIO_CLASSES = "flex size-24 shrink-0 items-center justify-center rounded-full border-2";

const RADIO_CHECKED_CLASSES =
  "border-primary-600 after:size-[10px] after:rounded-full border-6 radius-4";

export function AdminProfileSwitcher({
  headerRef,
  headerHandleRef,
  showActiveProfile = true,
}: {
  headerRef: RefObject<HTMLElement | null>;
  headerHandleRef: RefObject<HeaderElement | null>;
  showActiveProfile?: boolean;
}) {
  const { user, isAdmin } = useAuth();
  const { activeProfile, organizations } = useActiveProfile();
  const { t } = useTranslation("common");
  const router = useRouter();
  const { locale } = splitLocale(usePathname());
  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const options = useMemo<ProfileOption[]>(() => {
    if (!user) return [];
    const profiles: ActiveProfile[] = [
      { type: "personal" },
      ...organizations.map((org): ActiveProfile => ({ type: "organization", orgId: org.id })),
    ];
    if (isAdmin) profiles.push({ type: "system" });

    return profiles.map((profile) => ({
      profile,
      ...getProfileDetails(profile, {
        user,
        organizations,
        administratorLabel: t("header.administratorProfile"),
        organizationFallbackLabel: t("header.selectProfile"),
      }),
    }));
  }, [user, isAdmin, t, organizations]);

  useEffect(() => {
    const drawerHeader = headerRef.current?.querySelector(".agora-drawer .authenticated-header");
    if (!drawerHeader) return;

    const container = document.createElement("div");
    container.className = "admin-profile-switcher";
    drawerHeader.insertAdjacentElement("afterend", container);

    setPortalNode(container);

    return () => {
      container.remove();
      setPortalNode(null);
    };
  }, [headerRef, user?.id]);

  useEffect(() => {
    const dialog = headerRef.current
      ?.querySelector(".authenticated-header")
      ?.closest(".agora-dialog");
    if (!dialog) return;

    // Agora Header does not expose a drawer-close callback.
    const observer = new MutationObserver(() => {
      if (dialog.classList.contains("closed")) setIsSwitching(false);
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [headerRef, user?.id]);

  const selectProfile = (option: ProfileOption) => {
    setIsSwitching(false);
    headerHandleRef.current?.closeAll?.();
    router.push(localizeHref(option.href, locale));
  };

  if (!portalNode || options.length === 0 || (showActiveProfile && options.length === 1)) return null;

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
              const isActive = showActiveProfile && isSameProfile(option.profile, activeProfile);
              return (
                <li key={option.href}>
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
          <Icon
            name="agora-line-hardware-settings"
            dimensions="m"
            className="shrink-0 fill-current"
            aria-hidden
          />
          <span className="flex-1 text-left">
            {t("header.selectProfile")}
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
