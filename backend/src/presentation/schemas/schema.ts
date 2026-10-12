import type { GraphQLSchema } from 'graphql';
import { stitchSchemas } from '@graphql-tools/stitch';
import { PT2030Schema } from './fundo-europeu/pt2030';

let localSchemas: Promise<GraphQLSchema> | null = null;

export function getAllSchemas(): Promise<GraphQLSchema> {
  localSchemas ??= PT2030Schema()
    .then((pt2030Schema) =>
      stitchSchemas({
        subschemas: [pt2030Schema],
      }),
    )
    .catch((error) => {
      localSchemas = null;
      throw error;
    });

  return localSchemas;
}
