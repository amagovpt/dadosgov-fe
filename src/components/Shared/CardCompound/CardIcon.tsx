"use client";

import { twJoin } from "tailwind-merge";
import Icon from "../../Primitives/Icon";

export type cardIconProps = {
  icon: string;
  className?: string;
};

export default function CardIcon({ icon, className }: cardIconProps) {
  const isAgoraIcon: boolean = icon.startsWith("agora-");

  return (
    <div
      className={twJoin(
        "flex h-[56px] w-[56px] items-center justify-center rounded-8 bg-primary-100 p-16",
        className
      )}
    >
      {isAgoraIcon ? (
        <Icon name={icon} />
      ) : (
        <img src={`/Icons/${icon}.svg`} alt={icon.replaceAll("-", " ")} />
      )}
    </div>
  );
}
