
import { BeneficiariesAndProjectsResolver } from '@/presentation/resolvers/fundo-europeu/pt2030/beneficiarios-e-projetos';
import { buildSchema } from 'type-graphql';

export const PT2030Schema = async () =>
  buildSchema({
    resolvers: [
      BeneficiariesAndProjectsResolver,
    ],
  });
