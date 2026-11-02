import { ObjectType, Field, Float } from 'type-graphql';

@ObjectType()
export class Dimensions {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  amount: number;

  @Field(() => String)
  context: string;

  @Field(() => String)
  idImage: string;
}

export interface IEuDimensoesRepository {
  getDimensionsPRR(): Promise<Dimensions[]>;
}
