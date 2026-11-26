import type { ReactNode } from "react";
import { routeNamespaces } from "@/config/i18nConfig";
import { RouteTranslations } from "@/providers/RouteTranslations";

export default function ReusesLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <RouteTranslations params={params} namespaces={routeNamespaces["reuses"]}>
      {children}
    </RouteTranslations>
  );
}
