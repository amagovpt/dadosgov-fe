import { CardGeneralProps } from "@ama-pt/agora-design-system";
import CardGeneral from "@/components/Primitives/Cards/CardGeneral";
import IconComponent, { IconComponentProps } from "@/components/Primitives/IconComponent";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { Topic } from "@/service/types/tematic-areas";

interface TopicCardProps {
  topic?: Topic;
  variant?: CardGeneralProps["variant"];
  iconProps?: Partial<IconComponentProps>;
}

export function TopicCard({ topic, variant, iconProps }: TopicCardProps) {
  return (
    <CardGeneral
      titleText={
        <div className="flex flex-col gap-64">
          <span className="w-56 h-56 bg-primary-600 rounded-full flex justify-center items-center">
            <IconComponent name={topic?.icon || ""} {...iconProps} />
          </span>
          <Typograph tag="h3" className="text-l-bold">
            {topic?.title}
          </Typograph>
        </div>
      }
      descriptionText={topic?.description}
      anchor={{
        children: "",
        href: "/pages/areas-tematicas/" + topic?.slug,
        hasIcon: true,
        trailingIcon: "agora-line-arrow-right-circle",
        trailingIconActive: "agora-line-arrow-right-circle",
        trailingIconHover: "agora-line-arrow-right-circle",
        appearance: "link",
      }}
      variant={variant}
      isBlockedLink
    />
  );
}
