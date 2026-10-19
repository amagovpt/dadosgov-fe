import { buildSchema } from 'type-graphql';
import { BeneficiariesAndProjectsPRRResolver } from '@/presentation/resolvers/fundo-europeu/prr/beneficiarios-e-projetos';

export const PRRSchema = async () =>
  buildSchema({
    resolvers: [
      BeneficiariesAndProjectsPRRResolver,
    ],
  });
