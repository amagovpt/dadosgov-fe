import type { GraphQLSchema } from 'graphql';
import { buildSchema } from 'type-graphql';
import { BeneficiariesAndProjectsResolver } from '@/presentation/resolvers/fundo-europeu/pt2030/beneficiarios-e-projetos';
import { BeneficiariesAndProjectsPRRResolver } from '@/presentation/resolvers/fundo-europeu/prr/beneficiarios-e-projetos';

let localSchemas: Promise<GraphQLSchema> | null = null;

export function getAllSchemas(): Promise<GraphQLSchema> {
  localSchemas ??= buildSchema({
    resolvers: [
      BeneficiariesAndProjectsResolver,
      BeneficiariesAndProjectsPRRResolver,
    ],
  }).catch((error) => {
    localSchemas = null;
    throw error;
  });

  return localSchemas;
}
