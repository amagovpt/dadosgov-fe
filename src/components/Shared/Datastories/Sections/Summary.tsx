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
          <div className="col-span-12 bg-primary-700 p-32 lg:col-span-8 lg:p-64">
            <CardLinks
              variant="primary-700"
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
            />
          </div>
        </div>
      </InfoBlock.Root>
    </Section>
  );
}
