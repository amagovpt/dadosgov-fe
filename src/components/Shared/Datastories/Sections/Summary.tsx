import CardLinks from "@/components/Primitives/Cards/CardLinks";
import { SummarySection } from "@/service/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";

export type SummaryI = SummarySection;

export default function Summary({ id, title, description, anchors }: SummaryI) {
  return (
    <Section id={id} className="flex w-full justify-center bg-white py-64">
      <InfoBlock.Root className="flex flex-col gap-32">
        <div className="grid grid-cols-12 gap-32">
          <div className="col-span-12 lg:col-span-8 bg-primary-600 p-32 lg:p-64">
            <CardLinks
              title={title}
              description={formatHtmlParagraphs(description) as string[]}
              links={anchors.map((anchor) => {
                return {
                  children: anchor.children,
                  href: anchor.href,
                  trailingIcon: anchor?.icon ?? "agora-line-external-link",
                  trailingIconActive: anchor?.icon ?? "agora-line-external-link",
                  trailingIconHover: anchor?.icon ?? "agora-line-external-link",
                  target: "_blank",
                };
              })}
              className="bg-primary-600 !text-white [&_*]:!text-white [&_a:hover]:underline [&_a:hover]:decoration-white [&_svg]:!fill-white"
            />
          </div>
        </div>
      </InfoBlock.Root>
    </Section>
  );
}
