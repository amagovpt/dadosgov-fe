import {
  Datastories,
  DataStoriesPage,
  DataStoryMetadata,
} from "@/service/types/datastories/datastories";
import {
  Datastory,
  DatastorySection,
  RelatedSection,
} from "@/service/types/datastories/datastory";
import { DatastorySearchPage } from "@/service/types/datastories/pt2030/pt2030";
import { FoListPageHero } from "@/service/types/shared";
import apolloClient from "@/service/utils/apollo-client";
import { activeDatastories, DatastoryRef } from "@/utils/activeDatastories";
import { buildDatastoryIndex } from "@/utils/buildDatastoryIndex";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { notFound } from "next/navigation";

export async function getDataStoriesMetadata(locale: string = "pt") {
  const query = gql(/* GraphQL */ `
    query getDataStories {
        findDataStoriesPageSingleton {
            data {
                hero {
                    ${locale} {
                        title
                        description
                    }
                }
            }
        }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findDataStoriesPageSingleton: DataStoriesPage;
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching datastories information:", error);
    throw new Error("Failed to fetch datastories information");
  }

  return flattenData(data).findDataStoriesPageSingleton as FoListPageHero;
}

export async function getDataStories(locale: string = "pt") {
  const query = gql(/* GraphQL */ `
    query getDataStories {
        findDataStoriesPageSingleton {
            data {
                hero {
                    ${locale} {
                        title
                        description
                    }
                }
                search {
                    ${locale} {
                        label
                        placeholder
                        hint
                    }
                }
                noResults {
                    ${locale} {
                        icon
                        title
                        subtitle
                        description
                    }
                }
            }
        }
        queryDataStoriesContents {
            data {
                isActive {
                    iv
                }
                metadata{
                    ${locale} {
                        slug
                        theme
                        organizationName
                        title
                        description
                        image {
                            fileName
                            url
                            id
                        }
                        createdAt
                        tags {
                            tag
                        }
                    }
                }
            }
        }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findDataStoriesPageSingleton: DataStoriesPage;
    queryDataStoriesContents: Datastories;
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching datastories information:", error);
    throw new Error("Failed to fetch datastories information");
  }

  const pageContent = flattenData(data).findDataStoriesPageSingleton as DataStoriesPage;

  const datastories: Datastories = activeDatastories(
    Object.values(
      flattenData(data.queryDataStoriesContents as unknown as Record<string, unknown>)
    ) as DatastoryRef<DataStoryMetadata>[]
  );

  return { pageContent: pageContent, datastories: datastories };
}

/* -------------------------------------------------------------------------------------------------------------------------------- */


type RelatedDatastory = RelatedSection["datastories"][number];

/**
 * Removes deactivated datastories from a "related" section, and turns the section off when none
 * are left so neither the page nor the hero index shows an empty block.
 */
function withoutInactiveRelated(section: DatastorySection): DatastorySection {
  if (section?.schemaName !== "section-datastory-related-datastory") return section;

  const datastories = activeDatastories(
    section.datastories as unknown as DatastoryRef<RelatedDatastory>[]
  );
  return { ...section, datastories, active: datastories.length === 0 ? false : section.active };
}

export async function getDatastoryMetadata(
  slug: string,
  locale: string = "pt"
): Promise<DataStoryMetadata> {
  const query = gql(/* GraphQL */ `
    query QueryPublicDataModal($slug: String!) {
      queryDataStoriesContents(filter: $slug) {
        data {
          metadata{
            ${locale} {
              slug
              title
              image {
                fileName
                url
                id
              }
              createdAt
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    queryDataStoriesContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const datastory = data.queryDataStoriesContents[0]?.data;

  if (!datastory) {
    return {} as DataStoryMetadata;
  }

  return flattenData(datastory).metadata as DataStoryMetadata;
}

export async function getDatastory(slug: string, locale: string = "pt"): Promise<Datastory> {
  const query = gql(/* GraphQL */ `
    query QueryGetDataStoriesData($slug: String!) {
      queryDataStoriesContents(filter: $slug) {
        data {
          hero {
            ${locale} {
              title
              description
              index {
                title
              }
              breadcrumbs {
                label
                url
              }
            }
          }
          sections {
            ${locale} {
              isFirstSectionWhite
              sections {
                ... on SectionDatastoryBignumbersComponent {
                  schemaName
                  id
                  active
                  title
                  bignumbers {
                    icon
                    number
                    numberLabel
                    subtitle
                    title
                  }
                  dataReference {
                    date
                    title
                  }
                }
                ... on SectionDatastoryBignumbersIframeComponent {
                  id
                  active
                  schemaName
                  title
                  iframe {
                    source
                    classNames
                    classNameIframeBackground
                  }
                }
                ... on SectionDatastoryIframeComponent {
                  schemaName
                  id
                  active
                  description
                  title
                  links {
                    children
                    href
                    icon
                  }
                  iframe {
                    classNameIframeBackground
                    classNames
                    source
                  }
                }
                ... on SectionDatastoryOtherResourcesComponent {
                  schemaName
                  id
                  active
                  title
                  resources {
                    icon
                    title
                    subtitle
                    anchor {
                      href
                      icon
                    }
                  }
                }
                ... on SectionDatastoryRelatedDatastoryComponent {
                  schemaName
                  id
                  active
                  title
                  description
                  datastories {
                    data {
                      isActive {
                        iv
                      }
                      metadata {
                        ${locale} {
                          createdAt
                          description
                          slug
                          title
                        }
                      }
                    }
                  }
                }
                ... on SectionDatastoryTimelineComponent {
                  schemaName
                  id
                  active
                  title
                  description
                  cards {
                    title
                    subtitle
                  }
                  cardsLinkIcon
                  anchor {
                    children
                    icon
                  }
                  timeline {
                    title
                    description
                    events {
                      label
                      icon
                      title
                      description
                    }
                  }
                }
                ... on SectionDatastoryPublicAdminStructureComponent {
                  schemaName
                  id
                  active
                  title
                  parts {
                    centralAdmin {
                      icon
                      title
                      subtitle
                      description
                    }
                    regionalAdmin {
                      icon
                      title
                      subtitle
                      description
                    }
                    localAdmin {
                      icon
                      title
                      subtitle
                      description
                    }
                    socialFunds {
                      icon
                      title
                      subtitle
                      description
                    }
                    publicAdmin {
                      icon
                      title
                      subtitle
                      description
                    }
                  }
                }
                ... on SectionDatastorySummaryComponent {
                  schemaName
                  id
                  active
                  title
                  description
                  anchors {
                    children
                    href
                    icon
                  }
                }
                ... on SectionDatastoryDatasetsComponent {
                  schemaName
                  id
                  active
                  title
                  datasets {
                    image {
                      url
                    }
                    createdAt
                    organizationName
                    title
                    description
                    slug
                  }
                }
              }
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    queryDataStoriesContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const datastory = data.queryDataStoriesContents[0]?.data;

  if (!datastory) {
    return notFound();
  }

  const { hero, sections: rawSections } = flattenData(datastory) as Datastory;
  const sections = rawSections && {
    ...rawSections,
    sections: rawSections.sections?.map(withoutInactiveRelated),
  };
  // `index` only asks for `title`, and flattenData unwraps single-key objects, so it
  // arrives as the title string itself.
  const index = hero?.index as unknown as string | { title?: string } | undefined;
  const indexTitle = typeof index === "string" ? index : (index?.title ?? "");

  return {
    hero: {
      ...hero,
      index: { title: indexTitle, anchors: buildDatastoryIndex(sections?.sections) },
    },
    sections,
  };
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


export async function getDatastorySearchPage(
  slug: string,
  locale: string = "pt"
): Promise<DatastorySearchPage> {
  const query = gql(/* GraphQL */ `
    query QueryGetDataStoriesSearchPageData($slug: String!) {
      querySearchPagesEuropeanFundsContents(filter: $slug) {
        data {
          id {
            iv
          }
          hero {
            ${locale} {
              title
              description
              index {
                title
                anchors {
                  anchor {
                    href
                    children
                    icon
                  }
                }
              }
              breadcrumbs {
                url
                label
              }
            }
          }
          bigNumberTitle{
            ${locale}
          }
          bigNumbers {
            ${locale} {
              description
            }
          }
          block {
            ${locale} {
              title
              description
            }
          }
          inputSearch {
            ${locale} {
              label
              placeholder
              searchActionAltText
              voiceActionAltText
            }
          }
          typesOfBeneficiariesTitle {
            ${locale}
          }
          typesOfBeneficiaries {
            ${locale} {
              name
              title
              description
            }
          }
          filters {
            ${locale} {
              name
              label
            }
          }
          sortBy {
            ${locale} {
              name
              label
            }
          }
          noResults {
            ${locale} {
              image {
                url
              }
              title
              description
            }
          }
          relatedDatasets {
            ${locale} {
                  schemaName
                  id
                  active
                  title
                  datasets {
                    image {
                      url
                    }
                    createdAt
                    organizationName
                    title
                    description
                    slug
                  }
                }
          }
          relatedDatastories {
            ${locale} {
                 schemaName
                 id
                 active
                 title
                 description
                 datastories {
                   data {
                     metadata {
                       ${locale} {
                         createdAt
                         description
                         slug
                         title
                       }
                     }
                   }
                 }
              }
            }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    querySearchPagesEuropeanFundsContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const datastory = data.querySearchPagesEuropeanFundsContents[0]?.data;

  if (!datastory) {
    return notFound();
  }

  const dataFlatten = flattenData(datastory) as DatastorySearchPage;

  return dataFlatten;
}

