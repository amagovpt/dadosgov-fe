export interface AdminNavLink {
  id: string | null;
  label: string;
  href: string;
  icon: string | null;
  logo: string | null;
  enabled: boolean | null;
}

export interface AdminNavGroupData {
  id: string | null;
  key: string;
  label: string;
  icon: string | null;
  enabled: boolean | null;
  children: AdminNavLink[];
}

export interface AdminSideNavigationData {
  homeLink: AdminNavLink;
  groups: AdminNavGroupData[];
  orgChildren: AdminNavLink[];
}
