import { DimensaoResilienciaResolver } from '@/presentation/resolvers/fundo-europeu/prr/dimensao-resiliencia';
import { DimensionsPRRResolver } from '@/presentation/resolvers/fundo-europeu/prr/dimensoes';
import { DimensaoTransicaoClimaticaResolver } from '@/presentation/resolvers/fundo-europeu/prr/dimensao-transicao-climatica';

import { DigitalTransitionDimensionResolver } from '@/presentation/resolvers/fundo-europeu/prr/dimensao-transicao-digital';
import { BeneficiariesAndProjectsPRRResolver } from '@/presentation/resolvers/fundo-europeu/prr/beneficiarios-e-projetos';

export const PRRResolvers = [
  DimensaoResilienciaResolver,
  DimensionsPRRResolver,
  DimensaoTransicaoClimaticaResolver,
  DigitalTransitionDimensionResolver,
  BeneficiariesAndProjectsPRRResolver,
] as const;
