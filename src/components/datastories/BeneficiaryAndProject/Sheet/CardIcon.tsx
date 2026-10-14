import { ReactNode } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import InfoBlockDescription from "@/components/Shared/InfoBlock/InfoBlockDescription";
import IconComponent from "@/components/Primitives/IconComponent";

export interface ICardIcon {
  className?: string;
  classNameTitle?: string;
  classNameContent?: string;
  title?: string;
  description?: string;
  icon: {
    name: string;
    color?: string;
    backgroundColor?: string;
  };
  hideIcon?: boolean;
  children?: ReactNode;
}

export default function CardIcon({
  className = "",
  classNameTitle = "",
  classNameContent = "",
  title,
  description,
  icon = {
    name: "agora-line-arrow-right-circle",
    color: "#007CF8",
    backgroundColor: "primary-50",
  },
  hideIcon = false,
  children,
}: ICardIcon) {
  return (
    <article className={twMerge("flex flex-col gap-32 p-32 w-full", className)}>
      {!hideIcon && (
        <div
          className={twJoin(
            "flex items-center justify-center w-56 h-56 rounded-full",
            icon.backgroundColor,
          )}
        >
          <IconComponent name={icon.name} color={icon.color} />
        </div>
      )}

      <div className={twMerge("flex flex-col gap-8", classNameContent)}>
        {title && (
          <Typograph
            tag="h3"
            className={twMerge("text-l-bold", classNameTitle)}
          >
            {title}
          </Typograph>
        )}
        {description && (
          <InfoBlockDescription
            description={description}
            className="!text-s-regular text-neutral-700"
          />
        )}
      </div>

      {children}
    </article>
  );
}
