import apolloClient from "@/service/utils/apollo-client";
import { Home } from "@/service/types/home";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { RoadmapPageData } from "@/service/types/roadmap";

export async function getRoadmapPage(locale: string = "pt"): Promise<RoadmapPageData> {
  const query = gql(/* GraphQL */ `
    query MyQuery {
        findRoadmapPageSingleton {
            data {
                hero {
                    ${locale} {
                        title
                        description
                    }
                }
                visionAndPriorities {
                    ${locale} {
                        title
                        description
                    }
                }
                keyEvolution {
                    ${locale} {
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
                        title
                        description
                    }
                }
                followAlongAndJoinIn {
                    ${locale} {
                        title
                        description
                    }
                }
                historyOfDevelopment {
                    ${locale} {
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
