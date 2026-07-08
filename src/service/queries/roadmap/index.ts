import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { RoadmapPageData } from "@/service/types/roadmap";
import apolloClient from "@/service/utils/apollo-client";

export async function getRoadmapPage(locale: string = "pt"): Promise<RoadmapPageData> {
  const query = gql(/* GraphQL */ `
    query GetRoadmapPage {
        findRoadmapPageSingleton {
            data {
                hero {
                    ${locale} {
                        title
                        description
                    }
                }
                sitemap {
                    ${locale} {
                    title
                    links {
                        anchor {
                        href
                        children
                        icon
                        }
                    }
                    }
                }
                visionAndPriorities {
                    ${locale} {
                        id
                        title
                        description
                    }
                }
                keyEvolution {
                    ${locale} {
                        id
                        title
                    }
                }
                keyEvolutionPlanned {
                    ${locale} {
                        description
                        functionality
                        state
                    }
                }
                howWePrioritize {
                    ${locale} {
                        id
                        title
                        description
                    }
                }
                followAlongAndJoinIn {
                    ${locale} {
                        id
                        title
                        description
                    }
                }
                historyOfDevelopment {
                    ${locale} {
                        id
                        title
                    }
                }
                history {
                    ${locale} {
                        details {
                            title
                            description
                        }
                    }
                }
                actionTitle {
                    ${locale}
                }
                actions {
                    ${locale} {
                        anchor {
                            children
                            href
                        }
                    }
                }
                }
            }
        }
    `);

  const { data, error } = await apolloClient.query<{
    findRoadmapPageSingleton: { data: Record<string, unknown> };
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching roadmap page information:", error);
    throw new Error("Failed to fetch roadmap page information");
  }

  const roadmapPage = data.findRoadmapPageSingleton?.data;

  if (!roadmapPage) {
    return {} as RoadmapPageData;
  }

  return flattenData(roadmapPage) as unknown as RoadmapPageData;
}
