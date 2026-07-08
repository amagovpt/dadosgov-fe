import { AdminSideNavigation } from "@/components/admin/AdminSideNavigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard";
import { getAdminSideNavigation } from "@/service/commom/adminSideNavigation";
import type { AdminSideNavigationData } from "@/service/types/admin-side-navigation";
import { i18nConfig } from "@/config/i18nConfig";

export default async function AdminLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale = i18nConfig.locales.includes(rawLocale) ? rawLocale : i18nConfig.defaultLocale;

  let adminNavigation = {} as AdminSideNavigationData;
  try {
    adminNavigation = await getAdminSideNavigation(locale);
  } catch (error) {
    console.error("Error fetching admin side navigation:", error);
  }

  return (
    <div className="admin-wrapper">
      <AdminHeader />
      <div className="admin-layout">
        <AdminSideNavigation data={adminNavigation} />
        <div className="admin-layout__content">
          <AdminRouteGuard>{children}</AdminRouteGuard>
        </div>
      </div>
    </div>
  );
}
