import { InvestmentInDetails, ReformsInDetails } from '@/@types/dimensions-types';
import { Int, ObjectType, Field, Float } from 'type-graphql';

@ObjectType()
export class bigNumbersSustainableDevelopment {
  @Field(() => String)
  id: string;

  @Field(() => Int)
  investmentComponents: number;

  @Field(() => Int)
  tangibleInvestments: number;

  @Field(() => Int)
  structuralReforms: number;
}

@ObjectType()
export class TransitionClimaticInNumbers {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  totalInvestmentPrr: number;

  @Field(() => Float)
  allocatedFundsDimension: number;

  @Field(() => Float)
  fundsSpentDimension: number;
}

export interface IEuDimensionClimateTransitionRepository {
  getTransitionClimaticInNumbers(): Promise<TransitionClimaticInNumbers>;
  getBigNumbersSustainableDevelopment(): Promise<bigNumbersSustainableDevelopment>;
  getInvestmentInDetailsClimateTransition(): Promise<InvestmentInDetails>;
  getReformsInDetailsClimateTransition(): Promise<ReformsInDetails>;
}
