import CardLinks from "@/components/Primitives/Cards/CardLinks";
import { SummarySection } from "@/service/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";

export type SummaryI = SummarySection;

export default function Summary({ title, description, anchors }: SummaryI) {
  return (
    <Section className="flex w-full justify-center bg-white py-64">
      {" "}
      <InfoBlock.Root className="flex flex-col gap-32">
        <div className="grid grid-cols-12 gap-32">
          <div className="col-span-8 bg-primary-500 p-32 lg:p-64">
            <CardLinks
              variant="primary-500"
              title={title}
              description={formatHtmlParagraphs(description) as string[]}
              links={anchors.map((anchor) => {
                return {
                  children: anchor.children,
                  href: anchor.href,
                  trailingIcon: anchor.icon,
                  trailingIconActive: anchor.icon,
                  trailingIconHover: anchor.icon,
                };
              })}
            />
          </div>
        </div>
      </InfoBlock.Root>
    </Section>
  );
}
