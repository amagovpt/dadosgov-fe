"use client";

import React, { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarItem, Icon } from "@ama-pt/agora-design-system";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { fetchOrganization } from "@/service/api/organizations";
import { Organization } from "@/service/types/identity";

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
        href: "/admin/me/datasets",
      },
      // API (dataservices) oculta temporariamente — feature incompleta para PRD
      // {
      //   label: "API",
      //   href: "/admin/me/dataservices",
      // },
      {
        label: "Reutilizações",
        href: "/admin/me/reuses",
      },
      {
        label: "Recursos comunitários",
        href: "/admin/me/community-resources",
      },
      {
        label: "Perfil",
        href: "/admin/me/profile",
      },
      {
        label: "Estatísticas",
        href: "/admin/me/statistics",
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
        href: "/admin/system/datasets",
      },
      // API (dataservices) oculta temporariamente — feature incompleta para PRD
      // {
      //   label: "API",
      //   href: "/admin/system/dataservices",
      // },
      {
        label: "Reutilizações",
        href: "/admin/system/reuses",
      },
      {
        label: "Organizações",
        href: "/admin/system/organizations",
      },
      {
        label: "Utilizadores",
        href: "/admin/system/users",
      },
      {
        label: "Harvesters",
        href: "/admin/system/harvesters",
      },
      {
        label: "Recursos comunitários",
        href: "/admin/system/community-resources",
      },
      // Temas oculto temporariamente
      // {
      //   label: "Temas",
      //   href: "/admin/system/topics",
      // },
      {
        label: "Artigos",
        href: "/admin/system/posts",
      },
      {
        label: "Editorial",
        href: "/admin/system/editorial",
      },
      {
        label: "Logs",
        href: "/admin/system/logs",
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

  // Extract orgId from URL like /admin/org/{orgId}/...
  const urlOrgId = useMemo(() => {
    const match = pathname?.match(/^\/pages\/admin\/org\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Fetch org from URL if not already in user's org list
  useEffect(() => {
    let frameId: number | null = null;

    if (!urlOrgId) {
      frameId = requestAnimationFrame(() => {
        setUrlOrg(null);
      });
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
      };
    }
    const alreadyLoaded = organizations.some((o) => o.id === urlOrgId || o.slug === urlOrgId);
    if (alreadyLoaded) {
      frameId = requestAnimationFrame(() => {
        setUrlOrg(null);
      });
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
      };
    }
    fetchOrganization(urlOrgId)
      .then((org) => setUrlOrg(org))
      .catch(() => setUrlOrg(null));

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [urlOrgId, organizations]);

  const orgChildren = (orgBase: string): NavChild[] => [
    {
      label: "Conjunto de dados",
      href: `${orgBase}/datasets`,
    },
    // API (dataservices) oculta temporariamente — feature incompleta para PRD
    // {
    //   label: "API",
    //   href: `${orgBase}/dataservices`,
    // },
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
      children: orgChildren(`/admin/org/${org.id}`),
    }));

    // Inject the org from the URL if it's not already in the user's org list
    if (urlOrg && !organizations.some((o) => o.id === urlOrg.id)) {
      orgGroups.push({
        key: "organization" as const,
        label: urlOrg.name,
        children: orgChildren(`/admin/org/${urlOrg.id}`),
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
