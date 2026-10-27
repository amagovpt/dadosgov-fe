import type { Metadata } from "next";

import SystemMigrationsClient from "@/components/admin/migrations/views/SystemMigrationsClient";
import initTranslations from "@/app/i18n";

/**
 * 🚩 NO SQUIDEX QUERY, deliberately, like the jobs page and unlike the other
 * siblings under /admin/system/.
 *
 * Those read a BoXxx singleton without a try/catch, and the query throws when
 * it fails. GraphQL rejects a whole query when one field is missing from the
 * schema, so a singleton absent from one environment's CMS turns every page
 * that reads it into a 500 there -- LEDG-2520 did exactly that to fourteen
 * backoffice pages this month.
 *
 * This page in particular must not have that failure mode: it is what somebody
 * opens when they suspect an environment is broken, so being the thing that
 * breaks would be the worst possible shape for it.
 *
 * The sidebar entry still comes from Squidex, and there it degrades well:
 * (admin)/admin/layout.tsx catches that failure, so a missing entry costs the
 * link and not the page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({ locale, namespaces: ["admin-migrations"] });

  return {
    title: t("admin-migrations:metadata.title"),
    description: t("admin-migrations:metadata.description"),
  };
}

export default function SystemMigrationsPage() {
  return <SystemMigrationsClient />;
}
