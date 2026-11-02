import { Dimensions } from '@domain/fundo-europeu/prr/dimensoes';
import { DimensionsUseCase } from '@useCases/fundo-europeu/prr.use-case';
import { Query, Resolver } from 'type-graphql';

@Resolver()
export class DimensionsPRRResolver {
  @Query(() => [Dimensions])
  async queryDimensionsPRR(): Promise<Dimensions[]> {
    const data = await new DimensionsUseCase().getDimensionsPRRUseCase();
    return data;
  }
}
