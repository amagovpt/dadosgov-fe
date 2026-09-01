import { createInstance, i18n as I18nType, Resource } from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { i18nConfig } from "@/config/i18nConfig";

interface InitTranslationsParams {
  locale: string;
  namespaces: string[];
  i18nInstance?: I18nType;
  resources?: Resource;
}

export default async function initTranslations(
  { locale, namespaces, i18nInstance, resources }: InitTranslationsParams = {
    locale: i18nConfig.defaultLocale,
    namespaces: ["common"],
    i18nInstance: undefined,
    resources: undefined,
  }
): Promise<{
  i18n: I18nType;
  resources: Resource;
  t: I18nType["t"];
}> {
  const instance = i18nInstance || createInstance();

  instance.use(initReactI18next);

  if (!resources) {
    instance.use(
      resourcesToBackend(
        (language: string, namespace: string) => import(`@/locales/${language}/${namespace}.json`)
      )
    );
  }

  await instance.init({
    lng: locale,
    resources,
    fallbackLng: i18nConfig.defaultLocale,
    supportedLngs: i18nConfig.locales,
    defaultNS: namespaces[0],
    fallbackNS: namespaces[0],
    ns: namespaces,
    preload: resources ? [] : i18nConfig.locales,
    interpolation: {
      // i18next escapes interpolated values by default, which is redundant
      // here and actively wrong: React escapes everything it renders as a text
      // child, so the value gets escaped twice and the entities show up on
      // screen — a date interpolated into a string rendered as
      // "Atualizado às 01&#x2F;09&#x2F;2026" instead of "01/09/2026".
      //
      // This holds only while no translation output reaches a sink that
      // interprets markup, which was audited across the tree: no `t()` output
      // goes to `dangerouslySetInnerHTML`, to a URL attribute, to JSON-LD, to
      // `generateMetadata`, or to a markdown renderer.
      //
      // The one place raw HTML is reachable at all is the
      // `dangerouslySetInnerHTML` pass-through on Shared/Generics/Typograph.tsx.
      // No call site uses it today, but it is a typed, forwarded prop, so every
      // one of them could — which is why the invariant is pinned by a test that
      // walks the source (src/app/__tests__/i18n.test.tsx) rather than by this
      // comment. A new sink anywhere fails that test, and the value reaching it
      // has to be sanitised at the call site: this setting is not the thing to
      // rely on.
      escapeValue: false,
    },
  });

  instance.services.formatter?.add("number", (value: number, lng, options) => {
    const parts = new Intl.NumberFormat(lng, options).formatToParts(value);
    return parts.map((part) => (part.type === "group" ? " " : part.value)).join("");
  });

  return {
    i18n: instance,
    resources: { [locale]: instance.services.resourceStore.data[locale] },
    t: instance.t,
  };
}
