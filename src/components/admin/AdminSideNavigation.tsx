"use client";

import React, { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarItem, Icon } from "@ama-pt/agora-design-system";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { fetchOrganization } from "@/services/api";
import { Organization } from "@/types/api";

interface NavChild {
  label: string;
  href: string;
  icon?: string;
  customIcon?: string;
}

interface NavGroup {
  key: "profile" | "organization" | "system";
  label: string;
  icon?: string;
  children: NavChild[];
}

const navGroups: NavGroup[] = [
  {
    key: "profile",
    label: "Meu perfil",
    icon: "agora-line-user",
    children: [
      {
        label: "Conjunto de dados",
        href: "/pages/admin/me/datasets",
      },
      // API oculta temporariamente
      // {
      //   label: "API",
      //   href: "/pages/admin/dataservices",
      // },
      {
        label: "Reutilizações",
        href: "/pages/admin/me/reuses",
      },
      {
        label: "Recursos comunitários",
        href: "/pages/admin/me/community-resources",
      },
      {
        label: "Perfil",
        href: "/pages/admin/me/profile",
      },
      {
        label: "Estatísticas",
        href: "/pages/admin/me/statistics",
      },
    ],
  },
  {
    key: "organization",
    label: "Organização",
    icon: "agora-line-user-group",
    children: [],
  },
  {
    key: "system",
    label: "Sistema",
    icon: "agora-line-shield",
    children: [
      {
        label: "Conjunto de dados",
        href: "/pages/admin/system/datasets",
      },
      // API oculta temporariamente
      // {
      //   label: "API",
      //   href: "/pages/admin/system/dataservices",
      // },
      {
        label: "Reutilizações",
        href: "/pages/admin/system/reuses",
      },
      {
        label: "Organizações",
        href: "/pages/admin/system/organizations",
      },
      {
        label: "Utilizadores",
        href: "/pages/admin/system/users",
      },
      {
        label: "Harvesters",
        href: "/pages/admin/system/harvesters",
      },
      {
        label: "Recursos comunitários",
        href: "/pages/admin/system/community-resources",
      },
      // Temas oculto temporariamente
      // {
      //   label: "Temas",
      //   href: "/pages/admin/system/topics",
      // },
      {
        label: "Artigos",
        href: "/pages/admin/system/posts",
      },
      {
        label: "Editorial",
        href: "/pages/admin/system/editorial",
      },
    ],
  },
];

function toSentenceCase(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function AdminSideNavigation() {
  const pathname = usePathname();
  const { isAdmin, hasOrganization } = useAuth();
  const { organizations } = useActiveOrganization();
  const [urlOrg, setUrlOrg] = useState<Organization | null>(null);

  // Extract orgId from URL like /pages/admin/org/{orgId}/...
  const urlOrgId = useMemo(() => {
    const match = pathname?.match(/^\/pages\/admin\/org\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Fetch org from URL if not already in user's org list
  useEffect(() => {
    if (!urlOrgId) {
      setUrlOrg(null);
      return;
    }
    const alreadyLoaded = organizations.some((o) => o.id === urlOrgId || o.slug === urlOrgId);
    if (alreadyLoaded) {
      setUrlOrg(null);
      return;
    }
    fetchOrganization(urlOrgId)
      .then((org) => setUrlOrg(org))
      .catch(() => setUrlOrg(null));
  }, [urlOrgId, organizations]);

  const orgChildren = (orgBase: string): NavChild[] => [
    {
      label: "Conjunto de dados",
      href: `${orgBase}/datasets`,
    },
    {
      label: "Reutilizações",
      href: `${orgBase}/reuses`,
    },
    {
      label: "Discussões",
      href: `${orgBase}/discussions`,
    },
    {
      label: "Membros",
      href: `${orgBase}/members`,
    },
    {
      label: "Harvesters",
      href: `${orgBase}/harvesters`,
    },
    {
      label: "Recursos comunitários",
      href: `${orgBase}/community-resources`,
    },
    {
      label: "Perfil",
      href: `${orgBase}/profile`,
    },
    {
      label: "Estatísticas",
      href: `${orgBase}/statistics`,
    },
  ];

  const visibleGroups = useMemo(() => {
    const profileGroups = navGroups.filter((group) => {
      return group.key !== "organization" && group.key !== "system";
    });

    const orgGroups: NavGroup[] = organizations.map((org) => ({
      key: "organization" as const,
      label: org.name,
      children: orgChildren(`/pages/admin/org/${org.id}`),
    }));

    // Inject the org from the URL if it's not already in the user's org list
    if (urlOrg && !organizations.some((o) => o.id === urlOrg.id)) {
      orgGroups.push({
        key: "organization" as const,
        label: urlOrg.name,
        children: orgChildren(`/pages/admin/org/${urlOrg.id}`),
      });
    }

    const systemGroups = isAdmin
      ? navGroups.filter((group) => group.key === "system")
      : [];

    return [...profileGroups, ...orgGroups, ...systemGroups];
  }, [isAdmin, hasOrganization, organizations, urlOrg]);

  return (
    <nav className="admin-side-nav">
      <Sidebar variant="navigation" darkMode className="admin-sidebar-nav">
        {[
          <SidebarItem
            key="home"
            variant="navigation"
            darkMode
            className="admin-sidebar-nav__home-item"
            item={{
              children: (
                <Link href="/" className="admin-sidebar-nav__group-label">
                  <Icon
                    name="agora-line-home"
                    className="admin-sidebar-nav__group-icon"
                  />
                  Ir para dados.gov.pt
                </Link>
              ),
            }}
          />,
          ...visibleGroups.map((group) => {
          const hasActiveChild = group.children.some(
            (child) => pathname?.startsWith(child.href),
          );

          return (
            <SidebarItem
              key={group.label}
              variant="navigation"
              darkMode
              open={hasActiveChild}
              item={{
                children: (
                  <span className={`admin-sidebar-nav__group-label ${hasActiveChild ? "admin-sidebar-nav__group-label--active" : ""}`}>
                    {group.icon && (
                      <Icon
                        name={group.icon}
                        className="admin-sidebar-nav__group-icon"
                      />
                    )}
                    <span className="admin-sidebar-nav__group-label-text">{toSentenceCase(group.label)}</span>
                  </span>
                ),
                hasIcon: true,
                collapsedIconTrailing: "agora-line-chevron-up",
                collapsedIconHoverTrailing: "agora-solid-chevron-up",
                expandedIconTrailing: "agora-line-chevron-down",
                expandedIconHoverTrailing: "agora-solid-chevron-down",
              }}
            >
              <ul className="admin-sidebar-nav__children">
                {group.children.map((child) => {
                  const isActive = pathname?.startsWith(child.href);
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className={`admin-sidebar-nav__child-item ${
                          isActive
                            ? "admin-sidebar-nav__child-item--active"
                            : ""
                        }`}
                      >
                        {child.customIcon ? (
                          <Image
                            src={child.customIcon}
                            alt={child.label}
                            width={20}
                            height={20}
                            className="admin-sidebar-nav__child-icon"
                          />
                        ) : child.icon ? (
                          <Icon
                            name={child.icon}
                            className="admin-sidebar-nav__child-icon"
                          />
                        ) : null}
                        <span>{child.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SidebarItem>
          );
        }),
        ]}
      </Sidebar>
    </nav>
  );
}
