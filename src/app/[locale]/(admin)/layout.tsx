import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard";
import { getAdminSideNavigation } from "@/service/commom/adminSideNavigation";
import type { AdminSideNavigationData } from "@/service/types/admin-side-navigation";
import { i18nConfig } from "@/config/i18nConfig";

/**
 * The backoffice frame lives in `AdminRouteGuard`, not here: whether a visitor
 * gets the frame at all is the guard's answer, and it can only be had in the
 * browser (`useAuth`). All this layout owns is the side navigation's CMS read,
 * which stays on the server and travels down as data.
 *
 * That read runs even for a request the guard goes on to refuse. The refusal is
 * not knowable here, so the alternative would be moving the fetch into the
 * client — a worse trade than one wasted CMS call.
 */
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

  return <AdminRouteGuard navigation={adminNavigation}>{children}</AdminRouteGuard>;
}
