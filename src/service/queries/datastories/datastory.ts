import { DataStoryMetadata } from "@/service/types/datastories";
import apolloClient from "@/service/utils/apollo-client";
import {
  Datastory,
  DatastorySection,
  RelatedSection,
} from "@/service/types/datastories/datastory";
import { activeDatastories, DatastoryRef } from "@/utils/activeDatastories";
import { flattenData } from "@/utils/flattenObject";
import { buildDatastoryIndex } from "@/utils/buildDatastoryIndex";
import { gql } from "@apollo/client";
import { notFound } from "next/navigation";

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
