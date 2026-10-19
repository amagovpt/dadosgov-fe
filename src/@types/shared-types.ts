import { Field, ObjectType, registerEnumType } from 'type-graphql';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: 'Sort order direction',
});

@ObjectType()
export class SourceInfo {
  @Field(() => String)
  source!: string;

  @Field(() => String)
  sourceLink!: string;

  @Field(() => String, { nullable: true })
  referenceDate?: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  format!: string;

  @Field(() => String)
  url!: string;

  @Field(() => String, { nullable: true })
  publicationDate?: string;

  @Field(() => String, { nullable: true })
  updateDate?: string;

  @Field(() => String, { nullable: true })
  modificationDate?: string;
}
