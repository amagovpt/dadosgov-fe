import { Field, Float, Int, ObjectType } from 'type-graphql';
import { SourceInfo } from './shared-types';

@ObjectType()
export class GraphicData {
  @Field(() => String)
  year: string;

  @Field(() => String)
  quarter: string;

  @Field(() => Float, { nullable: true })
  baseline?: number;

  @Field(() => Float)
  objective: number;
}

@ObjectType()
export class MilestonesTarget {
  @Field(() => Boolean)
  finished: boolean;

  @Field(() => Boolean)
  hasGraph: boolean;

  @Field(() => [GraphicData])
  graphicData: GraphicData[];

  @Field(() => String)
  milestoneOrTarget: string;

  @Field(() => Float)
  completionPercentage: number;

  @Field(() => String)
  dsExecutionIndicator: string;

  @Field(() => String)
  numberOfInterventions: string;

  @Field(() => String)
  executionIndicatorName: string;

  @Field(() => String)
  executionIndicatorId: string;

  @Field(() => String)
  dtConclusionMilestoneTarget: string;
}

@ObjectType()
export class Investment {
  @Field(() => Boolean)
  finished: boolean;

  @Field(() => Float)
  loanValue: number;

  @Field(() => Float)
  amountSpent: number;

  @Field(() => String)
  cdInvestment: string;

  @Field(() => String)
  idInvestment: string;

  @Field(() => Float)
  assignedAmount: number;

  @Field(() => String)
  completionDate: string;

  @Field(() => String)
  investmentName: string;

  @Field(() => Float)
  lostFundAmount: number;

  @Field(() => [MilestonesTarget])
  milestonesTargets: MilestonesTarget[];

  @Field(() => Float)
  completionPercentage: number;

  @Field(() => String)
  investmentDescription: string;

  @Field(() => String)
  investmentDateCompletion: string;
}

@ObjectType()
export class InvestmentInDetailsData {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  number: number;

  @Field(() => [Investment])
  investments: Investment[];

  @Field(() => Float)
  completionPercentage: number;
}

@ObjectType()
export class Reform {
  @Field(() => String)
  cdReform: string;

  @Field(() => String)
  dsReform: string;

  @Field(() => Boolean)
  finished: boolean;

  @Field(() => String)
  reformId: string;

  @Field(() => String)
  nameReform: string;

  @Field(() => Float)
  amountSpent: number;

  @Field(() => Float)
  assignedAmount: number;

  @Field(() => String)
  completionDate: string;

  @Field(() => [MilestonesTarget])
  milestonesTargets: MilestonesTarget[];

  @Field(() => Float)
  completionPercentage: number;

  @Field(() => String)
  renovationCompletionDate: string;
}

@ObjectType()
export class ReformsInDetailsData {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  number: number;

  @Field(() => [Reform])
  reforms: Reform[];

  @Field(() => Float)
  completionPercentage: number;
}

@ObjectType()
export class ReformsInDetails {
  @Field(() => [ReformsInDetailsData])
  data: ReformsInDetailsData[];

  @Field(() => [SourceInfo])
  sourceInfo: SourceInfo[];
}

@ObjectType()
export class InvestmentInDetails {
  @Field(() => [InvestmentInDetailsData])
  data: InvestmentInDetailsData[];

  @Field(() => [SourceInfo])
  sourceInfo: SourceInfo[];
}
