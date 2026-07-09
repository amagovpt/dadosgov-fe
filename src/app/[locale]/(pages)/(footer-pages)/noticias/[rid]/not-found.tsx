"use client";

import { useTranslation } from "react-i18next";
import TextLink from "@/components/Primitives/TextLink";

export default function ArticleNotFound() {
  const { t } = useTranslation("common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-16">
      <h1 className="text-2xl-bold text-neutral-900">{t("articleNotFound")}</h1>
      <p className="text-neutral-600">{t("articleNotFoundDescription")}</p>
      <TextLink href="/noticias" className="hover:text-primary-700">
        {t("backToArticles")}
      </TextLink>
    </div>
  );
}
