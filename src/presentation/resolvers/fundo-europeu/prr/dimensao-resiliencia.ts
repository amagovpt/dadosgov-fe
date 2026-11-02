import { InvestmentInDetails, ReformsInDetails } from '@/@types/dimensions-types';
import {
  ResiliencyInNumbers,
  BigNumberMoreResilientCountryEconomy,
} from '@domain/fundo-europeu/prr/dimensao-resiliencia';
import { DimensaoResilienciaUseCase } from '@useCases/fundo-europeu/prr.use-case';
import { Query, Resolver } from 'type-graphql';

@Resolver()
export class DimensaoResilienciaResolver {
  @Query(() => ResiliencyInNumbers)
  async queryResiliencyInNumbers(): Promise<ResiliencyInNumbers> {
    const data =
      await new DimensaoResilienciaUseCase().getResiliencyInNumbersUseCase();
    return data;
  }

  @Query(() => BigNumberMoreResilientCountryEconomy)
  async queryBigNumberMoreResilientCountryEconomy(): Promise<BigNumberMoreResilientCountryEconomy> {
    const data =
      await new DimensaoResilienciaUseCase().getBigNumberMoreResilientCountryEconomyUseCase();
    return data;
  }

  @Query(() => InvestmentInDetails)
  async queryInvestmentInDetailsDimensionResiliency(): Promise<InvestmentInDetails> {
    const data =
      await new DimensaoResilienciaUseCase().getInvestmentInDetailsUseCase();
    return data;
  }

  @Query(() => ReformsInDetails)
  async queryReformsInDetailsDimensionResiliency(): Promise<ReformsInDetails> {
    const data =
      await new DimensaoResilienciaUseCase().getReformsInDetailsUseCase();
    return data;
  }
}
