import {
  BigNumbersDigitalAtTheServiceOfPeople,
  DigitalTransitionInNumbers,
} from '@domain/fundo-europeu/prr/dimensao-transicao-digital';
import { DigitalTransitionDimensionUseCase } from '@useCases/fundo-europeu/prr.use-case';
import { Query, Resolver } from 'type-graphql';
import {
  InvestmentInDetails,
  ReformsInDetails,
} from '@/@types/dimensions-types';

@Resolver()
export class DigitalTransitionDimensionResolver {
  @Query(() => DigitalTransitionInNumbers)
  async queryDigitalTransitionInNumbersPRR(): Promise<DigitalTransitionInNumbers> {
    const data =
      await new DigitalTransitionDimensionUseCase().getDigitalTransitionInNumbers();
    return data;
  }

  @Query(() => BigNumbersDigitalAtTheServiceOfPeople)
  async queryBigNumbersDigitalAtTheServiceOfPeople(): Promise<BigNumbersDigitalAtTheServiceOfPeople> {
    const data =
      await new DigitalTransitionDimensionUseCase().getBigNumbersDigitalAtTheServiceOfPeople();
    return data;
  }

  @Query(() => InvestmentInDetails)
  async queryInvestmentInDetailsDigitalTransitionPRR(): Promise<InvestmentInDetails> {
    const data =
      await new DigitalTransitionDimensionUseCase().getInvestmentInDetails();
    return data;
  }

  @Query(() => ReformsInDetails)
  async queryReformsInDetailsDigitalTransitionPRR(): Promise<ReformsInDetails> {
    const data =
      await new DigitalTransitionDimensionUseCase().getReformsInDetails();
    return data;
  }
}
