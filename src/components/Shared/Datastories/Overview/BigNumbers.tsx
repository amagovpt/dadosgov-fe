import { Typograph } from "../../Generics/Typograph";
import { InfoBlock } from "../../InfoBlock";
import Section from "../../Section";

export default function OverviewBigNumbers() {
  return (
    <Section className="flex flex-col gap-32 lg:gap-64">
      <InfoBlock.Root>
        <InfoBlock.Header>
          <InfoBlock.Title title={"title"} />
        </InfoBlock.Header>
        <InfoBlock.Content className="flex flex-col flex-wrap gap-32 lg:flex-auto">
          big numbers...
        </InfoBlock.Content>
      </InfoBlock.Root>
      <Typograph tag="p" className="text-m-regular text-neutral-700">
        label: <span className="text-neutral-900">something...</span>
      </Typograph>
    </Section>
  );
}
