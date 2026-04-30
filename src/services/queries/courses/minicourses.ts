import apolloClient from "@/services/apollo-client";
import { MiniCourseDetail } from "@/services/types/courses";
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
        return null
    }

    return flattenData(stepsCourses) as unknown as {
        updatedAt: string;
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
            steps {
                ${locale} {
                step {
                    title
                    description
                    image {
                    url
                    sourceUrl
                    fileName
                    }
                    imagePosition
                }
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
        return null;
    }

    return flattenData(stepsCourses) as unknown as {
        steps: MiniCourseDetail['steps'];
    };

}

export async function getMiniCourseConclusionPage(slug: string, locale: string = "pt") {
    const query = gql`
    query GetMiniCourseIntroductionPage($query: String!) {
        queryMinicursosContents(
            filter: $query
        ) {
            data {
            id {
                iv
            }
            conclusion {
                ${locale} {
                    title
                    description
                    image {
                        url
                        fileName
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
        return {} as MiniCourseDetail['steps'];
    }

    return flattenData(stepsCourses) as unknown as MiniCourseDetail['steps'];

}