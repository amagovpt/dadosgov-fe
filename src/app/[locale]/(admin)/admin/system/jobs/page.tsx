import type { Metadata } from "next";

import SystemJobsClient from "@/components/admin/jobs/views/SystemJobsClient";
import initTranslations from "@/app/i18n";

/**
 * 🚩 NO SQUIDEX QUERY HERE, and that is a deliberate divergence from the
 * sibling pages under /admin/system/, which each read a BoXxx singleton.
 *
 * Those pages call their query without a try/catch, and the query throws when
 * it fails. GraphQL rejects a whole query when one field is missing from the
 * schema -- it does not skip the field -- so a singleton absent from one
 * environment's CMS turns every page that reads it into a 500 there. That is
 * not hypothetical: LEDG-2520 added one field to the reuses query, the field
 * existed in dev/tst/ppr and not in production, and fourteen backoffice pages
 * went down.
 *
 * This page needs four strings of chrome, all of them technical vocabulary
 * with no editorial value, so they come from i18n and the page has no way to
 * fail that the data it shows does not already cover.
 *
 * The sidebar entry still comes from Squidex, and there it degrades well:
 * (admin)/admin/layout.tsx wraps getAdminSideNavigation in a try/catch, so a
 * missing entry costs the link and not the page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({ locale, namespaces: ["admin-jobs"] });

  return {
    title: t("admin-jobs:metadata.title"),
    description: t("admin-jobs:metadata.description"),
  };
}

export default function SystemJobsPage() {
  return <SystemJobsClient />;
}
