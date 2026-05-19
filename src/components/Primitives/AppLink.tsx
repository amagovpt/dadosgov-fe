import Link from "next/link";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { UrlObject } from "url";

export interface AppLinkI {
  href: string | UrlObject;
  children: ReactNode;
  target?: "_self" | "_blank" | "_parent" | "_top";
  className?: string;
}

export function AppLink({ href, children, target = "_blank", className }: AppLinkI) {
  return (
    <Link
      href={href}
      target={target}
      rel="noopener noreferrer"
      className={twMerge("text-primary-600 underline", className)}
    >
      {children}
    </Link>
  );
}
