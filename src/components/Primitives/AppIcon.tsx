"use client";

import { Icon, IconProps } from "@ama-pt/agora-design-system";
import { twMerge } from "tailwind-merge";

export default function AppIcon(args: IconProps) {
  return <Icon {...args} className={twMerge("h-20 w-20", args.className)} />;
}
