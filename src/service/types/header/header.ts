
export interface HeaderNavItem {
  id: string | null;
  label: string;
  href: string;
  icon: string | null;
  logo: string | null;
  bgColor: string | null;
  external: boolean | null;
  enabled: boolean | null;
  isLogout: boolean | null;
}

export interface HeaderNavCard {
  id: string;
  title: string;
  description: string;
  href: string;
  iconDefault: string;
  iconHover: string;
  enabled: boolean;
  opensSubmenu: string | null;
}

export interface HeaderNavGroup {
  id: string;
  label: string;
  enabled: boolean | null;
  requiresAuth: boolean | null;
  cards: HeaderNavCard[];
}

export interface HeaderDropdown {
  root: HeaderNavGroup;
  submenus: HeaderNavGroup[];
}

export interface HeaderEcosystem {
  ecosystemEntries: HeaderNavItem[];
  artePortals: HeaderNavItem[];
  description: string;
}

export interface HeaderNavigationData {
  authMenuItems: HeaderNavItem[];
  topLevelLinks: HeaderNavItem[];
  dropdowns: HeaderDropdown[];
  ecosytems: HeaderEcosystem;
}
