import type { ReactNode } from "react";
import { routeNamespaces } from "@/config/i18nConfig";
import { RouteTranslations } from "@/providers/RouteTranslations";

export default function SupportLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <RouteTranslations params={params} namespaces={routeNamespaces["(footer-pages)/ajuda-e-contactos"]}>
      {children}
    </RouteTranslations>
  );
}
