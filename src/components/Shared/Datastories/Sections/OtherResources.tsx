"use client";

import { OtherSection } from "@/types/datastories/datastory";
import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";
import { CardAction } from "@ama-pt/agora-design-system";
import { useRouter } from "next/navigation";

export type OtherResourcesI = OtherSection;

type ResourceI = OtherResourcesI["resources"][number];

// ----------------------------------------------------------------------------------------------------------------

function Resource({ icon, title, subtitle, anchor }: ResourceI) {
  const routerNav = useRouter();

  const handleClick = () => {
    routerNav.push(anchor.href);
  };

  return (
    <CardAction
      variant="primary-700"
      icon={{
        dimensions: "xxl",
        name: icon,
      }}
      titleText={title}
      descriptionText={subtitle}
      button={{
        children: anchor?.children,
        onClick: handleClick,
        hasIcon: true,
        iconOnly: true,
        leadingIcon: "agora-line-external-link",
        leadingIconHover: "agora-solid-external-link",
      }}
      className="[&_button]:bg-white [&_svg]:fill-primary-900"
    />
  );
}

// ----------------------------------------------------------------------------------------------------------------

export default function OtherResources({ title, resources }: OtherResourcesI) {
  return (
    <Section className="flex w-full justify-center py-64 bg-primary-100">
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
            {resources.map((resource, index) => {
              return (
                <div className="col-span-12 lg:col-span-6" key={`bignumber-${index}`}>
                  <Resource {...resource} />
                </div>
              );
            })}
          </div>
        </InfoBlock.Content>
      </InfoBlock.Root>
    </Section>
  );
}
