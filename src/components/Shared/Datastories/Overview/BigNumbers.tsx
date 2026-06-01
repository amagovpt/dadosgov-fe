import { BigNumbersSection } from "@/types/datastories/datastory";
import { Typograph } from "../../Generics/Typograph";
import { InfoBlock } from "../../InfoBlock";
import Section from "../../Section";

export type OverviewBigNumbersI = Omit<BigNumbersSection, "schemaName">;

export default function OverviewBigNumbers({ ...data }: OverviewBigNumbersI) {
  return (
    <Section className="flex flex-col gap-32 lg:gap-64">
      <InfoBlock.Root>
        <InfoBlock.Header>
          <InfoBlock.Title title={data.title} />
        </InfoBlock.Header>
        <InfoBlock.Content className="flex flex-col flex-wrap gap-32 lg:flex-auto">
          big numbers...
        </InfoBlock.Content>
      </InfoBlock.Root>
      <Typograph tag="p" className="text-m-regular text-neutral-700">
        {data.dataReference.title}{" "}
        <span className="text-neutral-900">{data.dataReference.date}</span>
      </Typograph>
    </Section>
  );
}
