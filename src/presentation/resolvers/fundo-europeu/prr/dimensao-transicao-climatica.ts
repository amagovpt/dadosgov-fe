import {
  InvestmentInDetails,
  ReformsInDetails,
} from '@/@types/dimensions-types';
import {
  TransitionClimaticInNumbers,
  bigNumbersSustainableDevelopment,
} from '@domain/fundo-europeu/prr/dimensao-transicao-climatica';
import { DimensaoTransicaoClimaticaUseCase } from '@useCases/fundo-europeu/prr.use-case';
import { Query, Resolver } from 'type-graphql';

@Resolver()
export class DimensaoTransicaoClimaticaResolver {
  @Query(() => TransitionClimaticInNumbers)
  async queryTransitionClimaticInNumbersPRR(): Promise<TransitionClimaticInNumbers> {
    const data =
      await new DimensaoTransicaoClimaticaUseCase().getTransitionClimaticInNumbersUseCase();
    return data;
  }

  @Query(() => bigNumbersSustainableDevelopment)
  async queryBigNumbersSustainableDevelopmentPRR(): Promise<bigNumbersSustainableDevelopment> {
    const data =
      await new DimensaoTransicaoClimaticaUseCase().getBigNumbersSustainableDevelopmentUseCase();
    return data;
  }

  @Query(() => InvestmentInDetails)
  async queryInvestmentInDetailsClimateTransitionPRR(): Promise<InvestmentInDetails> {
    const data =
      await new DimensaoTransicaoClimaticaUseCase().getInvestmentInDetailsClimateTransitionUseCase();
    return data;
  }

  @Query(() => ReformsInDetails)
  async queryReformsInDetailsClimateTransitionPRR(): Promise<ReformsInDetails> {
    const data =
      await new DimensaoTransicaoClimaticaUseCase().getReformsInDetailsClimateTransitionUseCase();
    return data;
  }
}
