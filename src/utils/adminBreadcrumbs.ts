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
  const trail = [{ label: t("admin-common:breadcrumbs.administration") }, ...items];

  return trail.map((item, index) => ({
    ...item,
    url: index === 0 || index === trail.length - 1 ? "" : item.url || "#",
  }));
}
