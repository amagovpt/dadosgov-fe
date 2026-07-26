export type AdminBreadcrumbItem = {
  label: string;
  url?: string;
};

export type NormalizedAdminBreadcrumbItem = {
  label: string;
  url: string;
};

type AdminBreadcrumbT = (key: string) => string;

export function normalizeAdminBreadcrumbItems(
  items: AdminBreadcrumbItem[]
): NormalizedAdminBreadcrumbItem[] {
  return items.map((item) => ({
    ...item,
    url: item.url === "#" ? "" : item.url ?? "",
  }));
}

function buildScopedAdminBreadcrumbItems({
  t,
  scopeLabel,
  scopeUrl = "",
  sectionLabel,
  sectionUrl = "",
}: {
  t: AdminBreadcrumbT;
  scopeLabel: string;
  scopeUrl?: string;
  sectionLabel: string;
  sectionUrl?: string;
}): AdminBreadcrumbItem[] {
  return [
    { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
    { label: scopeLabel, url: scopeUrl },
    { label: sectionLabel, url: sectionUrl },
  ];
}

export function buildUserAdminBreadcrumbItems({
  t,
  userLabel,
  sectionLabel,
  sectionUrl = "",
}: {
  t: AdminBreadcrumbT;
  userLabel?: string;
  sectionLabel: string;
  sectionUrl?: string;
}): AdminBreadcrumbItem[] {
  return buildScopedAdminBreadcrumbItems({
    t,
    scopeLabel: userLabel || "...",
    sectionLabel,
    sectionUrl,
  });
}

export function buildOrganizationAdminBreadcrumbItems({
  t,
  organizationLabel,
  sectionLabel,
  sectionUrl = "",
}: {
  t: AdminBreadcrumbT;
  organizationLabel?: string;
  sectionLabel: string;
  sectionUrl?: string;
}): AdminBreadcrumbItem[] {
  return buildScopedAdminBreadcrumbItems({
    t,
    scopeLabel: organizationLabel || t("admin-common:breadcrumbs.organization"),
    sectionLabel,
    sectionUrl,
  });
}

export function buildSystemAdminBreadcrumbItems({
  t,
  sectionLabel,
  sectionUrl = "",
}: {
  t: AdminBreadcrumbT;
  sectionLabel: string;
  sectionUrl?: string;
}): AdminBreadcrumbItem[] {
  return buildScopedAdminBreadcrumbItems({
    t,
    scopeLabel: t("admin-common:breadcrumbs.system"),
    sectionLabel,
    sectionUrl,
  });
}
