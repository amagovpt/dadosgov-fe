import { Int, ObjectType, Field, Float } from 'type-graphql';
import {
  InvestmentInDetails,
  ReformsInDetails,
} from '@/@types/dimensions-types';

// ######################################################
// ### Digital at the service of people - Big numbers ###
// ######################################################
@ObjectType()
export class BigNumbersDigitalAtTheServiceOfPeople {
  @Field(() => String)
  id: string;

  @Field(() => Int)
  investmentComponents: number;

  @Field(() => Int)
  tangibleInvestments: number;

  @Field(() => Int)
  structuralReforms: number;
}

// Digital Transition in numbers - Cards
@ObjectType()
export class DigitalTransitionInNumbers {
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

export interface IEuDimensionDigitalTransitionRepository {
  getDigitalTransitionInNumbers(): Promise<DigitalTransitionInNumbers>;
  getBigNumbersDigitalAtTheServiceOfPeople(): Promise<BigNumbersDigitalAtTheServiceOfPeople>;
  getInvestmentInDetails(): Promise<InvestmentInDetails>;
  getReformsInDetails(): Promise<ReformsInDetails>;
}
