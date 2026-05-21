import { gql } from "@apollo/client";

export function getDataStories(locale: string = "pt") {
  return gql(/* GraphQL */ `
    query getDataStories {
        queryDataStoriesContents {
            data {
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
}
