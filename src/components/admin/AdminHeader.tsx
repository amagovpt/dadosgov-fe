"use client";

import { useEffect, useRef } from "react";
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
import { logout } from "@/services/api";

function DeleteAccountPopupContent({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-[16px]">
      <p className="font-bold">Esta ação é irreversível.</p>
      <p>
        Todo o conteúdo publicado em seu nome permanecerá online, nos mesmos URLs, mas de forma
        anónima, ou seja, sem estar associado a um produtor de dados.
      </p>
      <p>
        Se também pretender eliminar o conteúdo que publicou, apague-o antes de eliminar a conta.
      </p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          appearance="solid"
          variant="danger"
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
          onClick={onClose}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export function AdminHeader() {
  const { user, samlLogin } = useAuth();
  const { show, hide } = usePopupContext();
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
      if (text === "Eliminar conta") {
        // Close the Authenticated panel before opening the popup
        const closeBtn = wrapper.querySelector<HTMLButtonElement>(
          ".authenticated-header .close",
        );
        if (closeBtn) closeBtn.click();

        setTimeout(() => {
          show(<DeleteAccountPopupContent onClose={hide} />, {
            title: "Tem a certeza que deseja eliminar esta conta?",
            closeAriaLabel: "Fechar",
            dimensions: "m",
          });
        }, 150);
      }
    };

    wrapper.addEventListener("click", handleClick);
    return () => wrapper.removeEventListener("click", handleClick);
  }, [show, hide]);

  return (
    <div
      ref={wrapperRef}
      className="admin-header"
      {...(user?.avatar_thumbnail
        ? { style: { "--admin-avatar-url": `url(${user.avatar_thumbnail})` } as React.CSSProperties }
        : { style: { "--admin-initials": `"${initials}"` } as React.CSSProperties })}
    >
      <Header darkMode>
        <div className="admin-header__search-left">
          <SearchDropdown
            id="admin-header-search"
            placeholder="Pesquisar"
            label="Pesquisar"
          />
        </div>
        <GeneralBar aria-label="Barra de opções do administrador">
          {/* Idioma oculto temporariamente */}
          <Authenticated
            avatarType={user?.avatar_thumbnail ? "image" : "icon"}
            srcPath={
              (user?.avatar_thumbnail || "agora-line-user") as unknown as undefined
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
                <a href={`/pages/users/${user?.slug || ''}`}>O meu perfil</a>
              </AuthenticatedBodyLink>
              {/* As minhas definições e Notificações ocultos temporariamente */}
            </AuthenticatedBody>
            <AuthenticatedFooter>
              <AuthenticatedFooterAction
                hasIcon
                leadingIcon="agora-line-trash"
                leadingIconHover="agora-solid-trash"
                variant="danger"
                appearance="link"
              >
                Eliminar conta
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
                  await logout();
                  window.location.href = "/";
                }}
              >
                Terminar sessão
              </AuthenticatedFooterAction>
            </AuthenticatedFooter>
          </Authenticated>
        </GeneralBar>
      </Header>
    </div>
  );
}
