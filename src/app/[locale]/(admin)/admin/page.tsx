import { AdminHomeRedirect } from "@/components/admin/AdminHomeRedirect";
import { getAdminSideNavigation } from "@/service/commom/adminSideNavigation";
import type { AdminSideNavigationData } from "@/service/types/admin-side-navigation";
import { i18nConfig } from "@/config/i18nConfig";

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = i18nConfig.locales.includes(rawLocale) ? rawLocale : i18nConfig.defaultLocale;

  let navigation = {} as AdminSideNavigationData;
  try {
    navigation = await getAdminSideNavigation(locale);
  } catch (error) {
    console.error("Error fetching admin side navigation:", error);
  }

  return <AdminHomeRedirect navigation={navigation} />;
}
