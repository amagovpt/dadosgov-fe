import { Suspense } from "react";
import type { Metadata } from "next";
import initTranslations from "@/app/i18n";
import CompleteRegistrationClient from "@/components/login/CompleteRegistrationClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({ locale, namespaces: ["login"] });
  return {
    title: t("completeRegistration.metadata.title"),
    description: t("completeRegistration.metadata.description"),
  };
}

export default function CompleteRegistrationPage() {
  return (
    <Suspense>
      <CompleteRegistrationClient />
    </Suspense>
  );
}
