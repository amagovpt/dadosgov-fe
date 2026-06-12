"use client";
import { icons, LucideProps } from "lucide-react";
import { Icon as AgoraIcon, IconProps } from "@ama-pt/agora-design-system";
import { twMerge } from "tailwind-merge";

export interface IconComponentProps extends IconProps {
  name: keyof typeof icons | (string & {});
  color?: string;
}

export default function IconComponent({
  name,
  color,
  ...rest
}: IconComponentProps & IconProps & LucideProps) {
  const isAgora = name.startsWith("agora-");

  const LucideIcon = !isAgora ? icons[name as keyof typeof icons] : undefined;

  // Ícone Agora explícito, ou nome Lucide inexistente → cai no Icon do Agora
  if (isAgora || !LucideIcon)
    return (
      <AgoraIcon
        name={name}
        {...rest}
        style={{ ...rest.style, ...(color ? { fill: color } : {}) }}
        className={twMerge(`fill-[${color}]`,rest.className)}
        aria-hidden
        focusable={false}
      />
    );

  return (
    <LucideIcon
      {...(rest as LucideProps)}
      color={color}
      className={twMerge(rest.className)}
      aria-hidden
      focusable={false}

    />
  );
}
