import type { GraphQLSchema } from 'graphql';
import { stitchSchemas } from '@graphql-tools/stitch';
import { PT2030Schema } from './fundo-europeu/pt2030';
import { PRRSchema } from './fundo-europeu/prr';

let localSchemas: Promise<GraphQLSchema> | null = null;

export function getAllSchemas(): Promise<GraphQLSchema> {
  localSchemas ??= Promise.all([PT2030Schema(), PRRSchema()])
    .then(([pt2030Schema, prrSchema]) =>
      stitchSchemas({
        subschemas: [pt2030Schema, prrSchema],
      }),
    )
    .catch((error) => {
      localSchemas = null;
      throw error;
    });

  return localSchemas;
}
