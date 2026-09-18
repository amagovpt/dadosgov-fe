export type AdminBreadcrumbItem = {
  label: string;
  url?: string;
};

export function buildAdminBreadcrumbItems({
  t,
  items,
}: {
  t: (key: string) => string;
  items: AdminBreadcrumbItem[];
}): Required<AdminBreadcrumbItem>[] {
  const trail = [
    { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
    ...items,
  ];
  return trail.map((item, index) => ({
    ...item,
    url: index === trail.length - 1 ? "" : item.url || "#",
  }));
}
