import {
  BoMembersMetadata,
  BoMembersMetadataField,
  BoMembersPage,
} from "@/service/types/admin/members";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoMembersMetadata(
  locale: string = "pt",
  field: BoMembersMetadataField = "orgMetadata"
): Promise<BoMembersMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoMembersMetadata {
      findBoMembersSingleton {
        data {
          ${field} {
            ${locale} {
              title
              description
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{ findBoMembersSingleton: BoMembersPage }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-members metadata:", error);
    throw new Error("Failed to fetch bo-members metadata");
  }

  const page = flattenData(data).findBoMembersSingleton as BoMembersMetadata;
  if (!page) throw new Error("Bo members metadata is missing");
  return page;
}

export async function getBoMembers(locale: string = "pt"): Promise<BoMembersPage> {
  const query = gql(/* GraphQL */ `
    query getBoMembers {
      findBoMembersSingleton {
        data {
          redirectMetadata {
            ${locale} {
              title
              description
            }
          }
          orgMetadata {
            ${locale} {
              title
              description
            }
          }
          orgHero {
            ${locale} {
              title
              description
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{ findBoMembersSingleton: BoMembersPage }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-members content:", error);
    throw new Error("Failed to fetch bo-members content");
  }

  const page = flattenData(data).findBoMembersSingleton as BoMembersPage;
  if (!page) throw new Error("Bo members content is missing");
  return page;
}
