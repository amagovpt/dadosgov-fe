"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Header,
  GeneralBar,
  Authenticated,
  AuthenticatedHeader,
  AuthenticatedBody,
  AuthenticatedBodyLink,
  AuthenticatedFooter,
  AuthenticatedFooterAction,
  type HeaderElement,
} from "@ama-pt/agora-design-system";
import SearchDropdown from "@/components/search/SearchDropdown";
import { AdminProfileSwitcher } from "@/components/admin/AdminProfileSwitcher";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/service/api/auth";

export function AdminHeader() {
  const { user, samlLogin } = useAuth();
  const { t } = useTranslation(["admin-common", "common"]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dsHeaderRef = useRef<HeaderElement>(null);
  const [generalBarLabelPortalNode, setGeneralBarLabelPortalNode] =
    useState<HTMLSpanElement | null>(null);

  const initials = user
    ? `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()
    : "";

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const generalBar = wrapper?.querySelector(".general-bar");
    if (!generalBar) return;

    let container = generalBar.querySelector(".general-bar-label-menu") as HTMLSpanElement | null;
    if (!container) {
      container = document.createElement("span");
      container.className = "general-bar-label-menu";
      container.style.display = "flex";
      container.style.alignItems = "center";

      container.style.order = "1";
    }
    generalBar.appendChild(container);

    queueMicrotask(() => {
      setGeneralBarLabelPortalNode(container);
    });

    return () => {
      generalBar.querySelector(".general-bar-label-menu")?.remove();
      setGeneralBarLabelPortalNode(null);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="admin-header [&_.navigation-bar]:hidden">
      <Header darkMode ref={dsHeaderRef}>
        <div className="admin-header__search-left">
          <SearchDropdown
            id="admin-header-search"
            placeholder={t("header.search")}
            label={t("header.search")}
          />
        </div>
        <GeneralBar aria-label={t("header.adminOptions")}>
          {/* Idioma oculto temporariamente */}
          <Authenticated
            avatarType={user?.avatar_thumbnail ? "image" : initials ? "initials" : "icon"}
            srcPath={
              (user?.avatar_thumbnail || initials || "agora-line-user") as unknown as undefined
            }
            hasBadge
            badgePosition="top-right"
            alt={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`}
            information={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`}
          >
            <AuthenticatedHeader>
              {user?.first_name} {user?.last_name}
            </AuthenticatedHeader>
            <AuthenticatedBody>
              <AuthenticatedBodyLink
                hasIcon
                leadingIcon="agora-line-user"
                leadingIconHover="agora-solid-user"
              >
                <Link href={`/users/${user?.slug || ""}`}>{t("header.profile")}</Link>
              </AuthenticatedBodyLink>
              <AuthenticatedBodyLink
                hasIcon
                leadingIcon="agora-line-mega-phone"
                leadingIconHover="agora-solid-mega-phone"
              >
                <Link href="/admin/notificacoes">{t("header.notifications")}</Link>
              </AuthenticatedBodyLink>
              {/* "As minhas definições" continua oculto até a página existir. */}
            </AuthenticatedBody>
            <AuthenticatedFooter>
              <AuthenticatedFooterAction
                hasIcon
                leadingIcon="agora-line-log-out"
                leadingIconHover="agora-solid-log-out"
                appearance="link"
                onClick={async () => {
                  if (samlLogin) {
                    window.location.href = "/saml/logout";
                    return;
                  }
                  try {
                    await logout();
                  } catch (error) {
                    console.error("Logout error:", error);
                  }
                  window.location.href = "/";
                }}
              >
                {t("header.logout")}
              </AuthenticatedFooterAction>
            </AuthenticatedFooter>
          </Authenticated>
        </GeneralBar>
      </Header>
      {generalBarLabelPortalNode &&
        createPortal(
          <span className="text-m-regular whitespace-nowrap text-primary-300">
            {t("generalBarLabel")}
          </span>,
          generalBarLabelPortalNode
        )}
      <AdminProfileSwitcher headerRef={wrapperRef} headerHandleRef={dsHeaderRef} />
      <div className="flex w-full items-center justify-center bg-neutral-100">
        <div className="container flex items-end justify-between py-16">
          <div className="flex flex-col">
            <span className="text-m-regular text-neutral-900">{t("header.adminAreaLabel")}</span>
            <span className="text-xl-semibold text-primary-900">{t("header.portalTitle")}</span>
          </div>
          <Image
            src="/Logos/Dados.gov_logocores.png"
            alt="dados.gov.pt"
            height={43}
            width={251}
            className="h-auto w-[190px]"
          />
        </div>
      </div>
    </div>
  );
}
