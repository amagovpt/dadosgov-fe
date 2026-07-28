"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
  Button,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import SearchDropdown from "@/components/search/SearchDropdown";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/service/api/auth";


function DeleteAccountPopupContent({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("admin-common");

  return (
    <div className="flex flex-col gap-16">
      <p className="font-bold">{t("deleteAccount.irreversible")}</p>
      <p>{t("deleteAccount.contentRemains")}</p>
      <p>{t("deleteAccount.deletePublishedContentFirst")}</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          {t("actions.cancel")}
        </Button>
        <Button
          appearance="solid"
          variant="danger"
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
          onClick={onClose}
        >
          {t("actions.delete")}
        </Button>
      </div>
    </div>
  );
}

export function AdminHeader() {
  const { user, samlLogin } = useAuth();
  const { show, hide } = usePopupContext();
  const { t } = useTranslation("admin-common");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const initials = user
    ? `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()
    : "";

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest(".footer-action");
      if (!btn) return;
      const text = btn.textContent?.trim();
      if (text === t("header.deleteAccount")) {
        // Close the Authenticated panel before opening the popup
        const closeBtn = wrapper.querySelector<HTMLButtonElement>(
          ".authenticated-header .close",
        );
        if (closeBtn) closeBtn.click();

        setTimeout(() => {
          show(<DeleteAccountPopupContent onClose={hide} />, {
            title: t("deleteAccount.title"),
            closeAriaLabel: t("deleteAccount.closeAriaLabel"),
            dimensions: "m",
          });
        }, 150);
      }
    };

    wrapper.addEventListener("click", handleClick);
    return () => wrapper.removeEventListener("click", handleClick);
  }, [show, hide, t]);

  return (
    <div ref={wrapperRef} className="admin-header">
      <Header darkMode>
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
            avatarType={user?.avatar_thumbnail ? "image" : (initials ? "initials" : "icon")}
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
                leadingIcon="agora-line-trash"
                leadingIconHover="agora-solid-trash"
                variant="danger"
                appearance="link"
              >
                {t("header.deleteAccount")}
              </AuthenticatedFooterAction>
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
    </div>
  );
}
