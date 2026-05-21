"use client";

import { Icon, IconProps } from "@ama-pt/agora-design-system";
import { twMerge } from "tailwind-merge";

export default function AppIcon(args: IconProps) {
  const isAgoraIcon: boolean = args.name ? args.name.startsWith("agora-") : false;

  return isAgoraIcon ? (
    <Icon {...args} className={twMerge("h-20 w-20", args.className)} />
  ) : (
    <img src={`/Icons/${args.name}.svg`} alt={args?.name?.replaceAll("-", " ")} />
  );
}
