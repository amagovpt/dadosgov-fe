"use client";
import { twMerge } from "tailwind-merge";
import IconComponent, { IconComponentProps } from "./IconComponent";

export interface IRoundedIconProps {
  icon: {
    name: IconComponentProps["name"];
    backgroundColor?: string;
    borderColor?: string;
    color?: string;
  };
  className?: string;
}

export default function RoundedIcon({ icon, className }: IRoundedIconProps) {
  return (
    <div className="flex">
      <div
        className={twMerge(
          `${icon.borderColor ? `border-2 border-${icon.borderColor}` : ""} bg-${icon.backgroundColor} flex h-56 w-56 items-center justify-center rounded-full p-16`,
          className
        )}
      >
        <IconComponent
          className={`${icon.name.includes("agora") ? `fill-${icon.color}` : `stroke-${icon.color}`}`}
          name={icon.name}
        />
      </div>
    </div>
  );
}
