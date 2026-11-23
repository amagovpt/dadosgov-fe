import { gql } from "@apollo/client";
import apolloClient from "@/service/utils/apollo-client";
import { GlossaryEntry, GlossaryPageData } from "@/service/types/glossary";

type Localized<T = string> = Record<string, T | null | undefined> | null | undefined;

interface RawGlossaryEntry {
  data: {
    word: Localized;
    description: Localized;
  };
}

interface GlossaryQueryResult {
  findGlossarioSingleton: {
    data: {
      hero__Dynamic: Localized<Partial<GlossaryPageData["hero"]>>;
      glossario: { iv: RawGlossaryEntry[] | null } | null;
    };
  } | null;
  queryGlossarioConteudoContents: RawGlossaryEntry[] | null;
}

const ENTRY_FIELDS = `
  data {
    word { pt en }
    description { pt en }
  }
`;

const GLOSSARY_QUERY = gql`
  query GetGlossaryPage {
    findGlossarioSingleton {
      data {
        hero__Dynamic { pt en }
        glossario { iv { ${ENTRY_FIELDS} } }
      }
    }
    queryGlossarioConteudoContents(top: 1000) { ${ENTRY_FIELDS} }
  }
`;

/** The requested locale when filled in, otherwise `pt` (most entries only exist in pt). */
function pickLocale<T>(value: Localized<T>, locale: string): T | undefined {
  return value?.[locale] || value?.pt || undefined;
}

function toEntry(raw: RawGlossaryEntry, locale: string): GlossaryEntry | null {
  const word = pickLocale(raw.data.word, locale)?.trim();
  if (!word) return null;
  return { word, description: pickLocale(raw.data.description, locale) ?? "" };
}

/**
 * Glossary page from Squidex: the `glossario` singleton holds the hero (JSON field, per
 * locale) and the curated list of `glossario-conteudo` references. While that list is
 * empty, every published `glossario-conteudo` entry is shown, so the page is never blank.
 */
export async function getGlossaryPage(locale: string = "pt"): Promise<GlossaryPageData> {
  const empty: GlossaryPageData = { hero: { title: "", subtitle: "" }, glossary: [] };

  try {
    const { data, error } = await apolloClient.query<GlossaryQueryResult>({
      query: GLOSSARY_QUERY,
    });

    if (error || !data) {
      console.error("Error fetching glossary page:", error);
      return empty;
    }

    const singleton = data.findGlossarioSingleton?.data;
    const curated = singleton?.glossario?.iv ?? [];
    const source = curated.length > 0 ? curated : (data.queryGlossarioConteudoContents ?? []);
    const hero = pickLocale(singleton?.hero__Dynamic, locale);

    return {
      hero: { title: hero?.title ?? "", subtitle: hero?.subtitle ?? "" },
      glossary: source
        .map((raw) => toEntry(raw, locale))
        .filter((entry): entry is GlossaryEntry => entry !== null),
    };
  } catch (error) {
    console.error("Error fetching glossary page:", error);
    return empty;
  }
}
