import apolloClient from "@/service/utils/apollo-client";
import { MiniCourseDetail } from "@/service/types/courses";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export function getMiniCoursesPages(locale: string = "pt") {
    return gql`
        query MyQuery {
            findPageMinicursosSingleton {
                data {
                hero {
                    ${locale} {
                        title
                        description
                        image {
                            url
                            id
                            fileName
                        }
                        updatedAt
                    }
                }

                minicursos {
                    ${locale} {
                        data {
                            id {
                                iv
                            }
                            title {
                                ${locale}
                            }
                            description {
                                ${locale}
                            }
                            updatedAt {
                                iv
                            }
                        }
                    }
                }
                }
            }
            }

  `;
}


export async function getMiniCourseIntroductionPage(slug: string, locale: string = "pt") {
    const query = gql`
    query GetMiniCourseIntroductionPage($query: String!) {
        queryMinicursosContents(
            filter: $query
        ) {
            data {
            id {
                iv
            }
            title {
                ${locale}
            }
            updatedAt {
                iv
            }
            introduction {
                ${locale} {
                    title
                    description
                    image {
                        url
                        fileName
                        id
                    }
                    imagePosition
                }
            }
            }
        }
    }
    `
    const { data, error } = await apolloClient.query<{
        queryMinicursosContents: Array<{
            data: Record<string, unknown>;
        }>;
    }>({
        query: query,
        variables: {
            query: `data/id/iv eq '${slug}'`,
        },
    });

    if (!data || error) {
        console.error("Error fetching introduction data information:", error);
        throw new Error("Failed to fetch introduction data information");
    }

    const stepsCourses = data.queryMinicursosContents[0]?.data;

    if (!stepsCourses) {
        return {} as {
            updatedAt: string;
            id: string;
            title: string;
            introduction: MiniCourseDetail['introduction'];
        };
    }

    return flattenData(stepsCourses) as unknown as {
        updatedAt: string;
        id: string;
        title: string;
        introduction: MiniCourseDetail['introduction'];
    };

}

export async function getMiniCourseStepsPage(slug: string, locale: string = "pt") {
    const query = gql`
    query GetMiniCourseIntroductionPage($query: String!) {
        queryMinicursosContents(
            filter: $query
        ) {
            data {
            id {
                iv
            }
            title {
                ${locale}
            }
            steps {
                ${locale} {
                step {
                    title
                    description
                    image {
                    url
                    id
                    fileName
                    }
                    imagePosition
                }
                }
            }
            conclusion {
                ${locale} {
                    title
                    description
                    image {
                        url
                        fileName
                        id
                    }
                    imagePosition
                }
            }
            }
        }
    }
    `
    const { data, error } = await apolloClient.query<{
        queryMinicursosContents: Array<{
            data: Record<string, unknown>;
        }>;
    }>({
        query: query,
        variables: {
            query: `data/id/iv eq '${slug}'`,
        },
    });

    if (!data || error) {
        console.error("Error fetching Steps data information:", error);
        throw new Error("Failed to fetch introduction data information");
    }

    const stepsCourses = data.queryMinicursosContents[0]?.data;

    if (!stepsCourses) {
        return {} as {
            id: string;
            title: string;
            steps: MiniCourseDetail['steps'];
            conclusion: MiniCourseDetail['conclusion'];
        };
    }

    return flattenData(stepsCourses) as unknown as {
        id: string;
        title: string;
        steps: MiniCourseDetail['steps'];
        conclusion: MiniCourseDetail['conclusion'];
    };

}
