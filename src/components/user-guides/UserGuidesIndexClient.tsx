"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import FoNoResults from "@/components/common/FoNoResults";
import SimpleSiteMap from "@/components/Shared/SiteMap/SimpleSiteMap";
import type { UserGuideTheme } from "@/service/types/user-guides";
import { filterUserGuideThemes } from "./filterUserGuideThemes";
import { UserGuideCard } from "./UserGuideCard";

interface UserGuidesIndexClientProps {
  themes: UserGuideTheme[];
}

export function UserGuidesIndexClient({ themes }: UserGuidesIndexClientProps) {
  const { t } = useTranslation("user-guides");
  const query = useSearchParams().get("q")?.trim() ?? "";

  const visibleThemes = useMemo(() => filterUserGuideThemes(themes, query), [themes, query]);
  const anchors = useMemo(
    () => visibleThemes.map((theme) => ({ href: `#${theme.id}`, children: theme.title })),
    [visibleThemes]
  );

  if (visibleThemes.length === 0) {
    return (
      <div className="container flex justify-center pt-64 pb-96">
        {query ? (
          <FoNoResults
            icon="agora-line-search"
            title={t("noResults.title", { query })}
            subtitle={t("noResults.subtitle")}
            description={t("noResults.description")}
          />
        ) : (
          <p className="text-m-regular text-neutral-700">{t("empty")}</p>
        )}
      </div>
    );
  }

  return (
    // Flex on mobile: 11 × 32px grid gaps alone are wider than a 375px viewport.
    <div className="container flex flex-col md:grid md:grid-cols-12 gap-32 pt-64 pb-96">
      <nav className="hidden md:block md:col-span-4" aria-label={t("onThisPage")}>
        <SimpleSiteMap
          title={t("onThisPage")}
          anchor={anchors}
          className="[&_.children-wrapper]:text-s-regular!"
        />
      </nav>
      <div className="col-span-12 md:col-span-8 flex flex-col gap-64">
        {visibleThemes.map((theme) => (
          <section key={theme.id} id={theme.id} className="flex flex-col gap-24 scroll-mt-120">
            <div className="flex flex-col gap-8">
              <h2 className="text-xl-bold text-primary-900">{theme.title}</h2>
              {theme.description && (
                <p className="text-s-regular text-neutral-900">{theme.description}</p>
              )}
            </div>
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-32">
              {theme.guides.map((guide) => (
                <li key={guide.id}>
                  <UserGuideCard guide={guide} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
