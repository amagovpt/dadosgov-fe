import { gql } from "@apollo/client";

export function getCoursesPage(locale: string = "pt") {
    return gql`
       query GetCoursesPage {
        findPageCursosSingleton {
            data {
            hero {
                ${locale} {
                    title
                    description
                    updatedAt
                    image {
                        url
                        fileName
                        id
                    }
                }
            }
            miniCourses {
                ${locale} {
                    title
                    description
                    courses {
                        ... on Minicursos {
                        data {
                                id {
                                        iv 
                                    }
                                title {${locale}}
                                description {${locale}}
                                updatedAt {iv}
                                cover {
                                    iv {
                                        url
                                        fileName
                                        id
                                    }
                                }
                            }
                        }
                    }
                    anchor {
                        children
                        href
                    }
                }
            }
            otherCourses {
                ${locale} {
                title
                description
                courses {
                    ... on Cursos {
                    data {
                        image {
                        iv {
                            fileName
                            url
                            id
                        }
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
        }
        }
    `;

}