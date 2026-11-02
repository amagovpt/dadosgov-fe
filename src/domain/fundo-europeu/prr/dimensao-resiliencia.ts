import { InvestmentInDetails, ReformsInDetails } from '@/@types/dimensions-types';
import { ObjectType, Field, Int, Float } from 'type-graphql';

@ObjectType()
export class ResiliencyInNumbers {
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

@ObjectType()
export class BigNumberMoreResilientCountryEconomy {
  @Field(() => String)
  id: string;

  @Field(() => Int)
  investmentComponents: number;

  @Field(() => Int)
  concreteInvestments: number;

  @Field(() => Int)
  structuralReforms: number;
}

export interface IEuDimensaoResilienciaRepository {
  getResiliencyInNumbers(): Promise<ResiliencyInNumbers>;
  getBigNumberMoreResilientCountryEconomy(): Promise<BigNumberMoreResilientCountryEconomy>;
  getInvestmentInDetails(): Promise<InvestmentInDetails>;
  getReformsInDetails(): Promise<ReformsInDetails>;
}
