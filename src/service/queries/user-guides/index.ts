import { i18nConfig } from "@/config/i18nConfig";
import type { UserGuide, UserGuideMetadata, UserGuidesPage } from "@/service/types/user-guides";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { emptyUserGuidesPage, normalizeUserGuide, normalizeUserGuidesPage } from "./normalize";

// The locale is interpolated into the query text (Squidex has no locale variable), so it is
// pinned to the configured locales; the slug goes into an OData filter, so it is pinned to the
// slug alphabet enforced by the schema.
const resolveLocale = (locale: string) =>
  i18nConfig.locales.includes(locale) ? locale : i18nConfig.defaultLocale;
const isValidSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

const ASSET_FIELDS = "id url fileName slug fileSize fileType";

export async function getUserGuidesPage(locale: string = "pt"): Promise<UserGuidesPage> {
  const lang = resolveLocale(locale);
  const query = gql(/* GraphQL */ `
    query getUserGuidesPage {
      findUserGuidesPageSingleton {
        data {
          title { ${lang} }
          description { ${lang} }
          searchLabel { ${lang} }
          searchPlaceholder { ${lang} }
          heroImage { iv { ${ASSET_FIELDS} } }
          updatedAt { iv }
          themes {
            ${lang} {
              id
              isActive
              title
              description
              guides {
                ... on UserGuides {
                  data {
                    id { iv }
                    title { ${lang} }
                    cardDescription { ${lang} }
                  }
                }
              }
            }
          }
        }
      }
    }
  `);

  try {
    const { data, error } = await apolloClient.query<{
      findUserGuidesPageSingleton: { data: Record<string, unknown> } | null;
    }>({ query });

    if (error) console.error("Error fetching user guides page:", error);
    if (!data?.findUserGuidesPageSingleton?.data) return emptyUserGuidesPage();

    return normalizeUserGuidesPage(flattenData(data, lang).findUserGuidesPageSingleton);
  } catch (error) {
    console.error("Error fetching user guides page:", error);
    return emptyUserGuidesPage();
  }
}

/** Returns `null` when the guide does not exist (or the CMS is unreachable), so the page 404s. */
export async function getUserGuide(slug: string, locale: string = "pt"): Promise<UserGuide | null> {
  if (!isValidSlug(slug)) return null;
  const lang = resolveLocale(locale);
  const query = gql(/* GraphQL */ `
    query getUserGuide($filter: String!) {
      queryUserGuidesContents(filter: $filter, top: 1) {
        data {
          id { iv }
          title { ${lang} }
          cardDescription { ${lang} }
          description { ${lang} }
          requirementNote { ${lang} }
          status { iv }
          statusNotice { ${lang} }
          pdf { ${lang} { ${ASSET_FIELDS} } }
          tasks {
            ${lang} {
              ... on UserGuideTaskComponent {
                id
                title
                audience
                objective
                steps { text }
                example
                videoUrl
                video { id slug fileName mimeType }
                mediaCaption
                tip
              }
            }
          }
          relatedGuides {
            iv {
              ... on UserGuides {
                data {
                  id { iv }
                  title { ${lang} }
                  cardDescription { ${lang} }
                }
              }
            }
          }
          usefulResources { ${lang} { label url } }
          updatedAt { iv }
        }
      }
    }
  `);

  try {
    const { data, error } = await apolloClient.query<{
      queryUserGuidesContents: Array<{ data: Record<string, unknown> }> | null;
    }>({ query, variables: { filter: `data/id/iv eq '${slug}'` } });

    if (error) console.error(`Error fetching user guide "${slug}":`, error);
    const guide = data?.queryUserGuidesContents?.[0]?.data;
    if (!guide) return null;

    return normalizeUserGuide(flattenData(guide, lang));
  } catch (error) {
    console.error(`Error fetching user guide "${slug}":`, error);
    return null;
  }
}

export async function getUserGuideMetadata(
  slug: string,
  locale: string = "pt"
): Promise<UserGuideMetadata | null> {
  if (!isValidSlug(slug)) return null;
  const lang = resolveLocale(locale);
  const query = gql(/* GraphQL */ `
    query getUserGuideMetadata($filter: String!) {
      queryUserGuidesContents(filter: $filter, top: 1) {
        data {
          title { ${lang} }
          description { ${lang} }
        }
      }
    }
  `);

  try {
    const { data } = await apolloClient.query<{
      queryUserGuidesContents: Array<{ data: Record<string, unknown> }> | null;
    }>({ query, variables: { filter: `data/id/iv eq '${slug}'` } });

    const guide = data?.queryUserGuidesContents?.[0]?.data;
    if (!guide) return null;

    const flat = flattenData(guide, lang);
    return {
      title: typeof flat.title === "string" ? flat.title : "",
      description: typeof flat.description === "string" ? flat.description : "",
    };
  } catch (error) {
    console.error(`Error fetching user guide metadata "${slug}":`, error);
    return null;
  }
}
