import { BigNumbersSection } from "@/service/types/datastories/datastory";
import { Typograph } from "../../Generics/Typograph";
import { InfoBlock } from "../../InfoBlock";
import Section from "../../Section";
import AppIcon from "@/components/Primitives/AppIcon";
import { twMerge } from "tailwind-merge";

// ----------------------------------------------------------------------------------------------------------------

export type BigNumbersI = Omit<BigNumbersSection, "schemaName"> & { className?: string };

export type BigNumberI = BigNumbersI["bignumbers"][number];

// ----------------------------------------------------------------------------------------------------------------

function BigNumber({ icon, number, numberLabel, title, subtitle }: BigNumberI) {
  return (
    <div className="flex flex-row gap-16">
      <div className="h-fit w-fit rounded-8 bg-primary-100 p-16">
        <AppIcon name={icon} className="h-24 w-24 !fill-primary-600" />
      </div>
      <div className="flex flex-col">
        <p>
          <Typograph tag="span" className="text-3xl-bold text-white">
            {number}
          </Typograph>{" "}
          <Typograph tag="span" className="text-xl-light text-white">
            {numberLabel}
          </Typograph>
        </p>
        <Typograph tag="p" className="text-m-regular text-white">
          {title}
        </Typograph>
        <Typograph tag="p" className="text-s-regular text-primary-100">
          {subtitle}
        </Typograph>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------------------------------------

export default function BigNumbers({
  id,
  title,
  bignumbers,
  dataReference,
  className,
}: BigNumbersI) {
  return (
    <Section
      id={id}
      className={twMerge("flex w-full justify-center bg-primary-600 py-64", className)}
    >
      <InfoBlock.Root className="flex-col gap-32">
        <InfoBlock.Header className="w-full gap-16 lg:w-1/2">
          <InfoBlock.Title
            titleLevel="h2"
            title={title}
            className="text-2xl font-bold text-white"
          />
        </InfoBlock.Header>
        <InfoBlock.Content className="flex flex-col gap-32 lg:gap-64">
          <div className="grid grid-cols-12 gap-32">
            {bignumbers.map((bignumber, index) => {
              return (
                <div className="col-span-12 md:col-span-6 lg:col-span-4" key={`bignumber-${index}`}>
                  <BigNumber {...bignumber} />
                </div>
              );
            })}
          </div>
          {dataReference?.title && dataReference?.date && (
            <Typograph tag="p" className="text-m-regular text-white">
              {dataReference.title} <span className="text-primary-100">{dataReference.date}</span>
            </Typograph>
          )}
        </InfoBlock.Content>
      </InfoBlock.Root>
    </Section>
  );
}
