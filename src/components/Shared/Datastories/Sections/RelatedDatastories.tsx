import { RelatedSection } from "@/types/datastories/datastory";
import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";

export type RelatedDatastoriesI = RelatedSection;

// ----------------------------------------------------------------------------------------------------------------

function DatastoryCard() {
  return null;
}

// ----------------------------------------------------------------------------------------------------------------

export function RelatedDatastories({ title }: RelatedDatastoriesI) {
  return (
    <Section className="flex w-full justify-center bg-primary-100 py-64">
      <InfoBlock.Root className="flex-col gap-32">
        <InfoBlock.Header>
          <InfoBlock.Title
            titleLevel="h2"
            title={title}
            className="text-2xl font-bold text-primary-900"
          />
        </InfoBlock.Header>
        <InfoBlock.Content className="flex flex-col gap-32">
          <div className="grid grid-cols-12 gap-32">
            {datastories.map((datastory, index) => {
              return (
                <div className="col-span-12 lg:col-span-6" key={`bignumber-${index}`}>
                  <DatastoryCard {...datastory} />
                </div>
              );
            })}
          </div>
        </InfoBlock.Content>
      </InfoBlock.Root>
    </Section>
  );
}
