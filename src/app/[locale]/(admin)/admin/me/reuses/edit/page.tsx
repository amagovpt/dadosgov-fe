import type { Metadata } from "next";
import ReusesEditClient from "@/components/admin/reuses/views/ReusesEditClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-reuses"],
  });

  return {
    title: t("metadata.editTitle", { ns: "admin-reuses" }),
    description: t("metadata.myEditDescription", { ns: "admin-reuses" }),
  };
}

export default function ReusesEditPage() {
  return <ReusesEditClient />;
}
