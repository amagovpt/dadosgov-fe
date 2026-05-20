import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { UrlObject } from "url";

export interface AppLinkI extends LinkProps {
  href: string | UrlObject;
  children: ReactNode;
  target?: "_self" | "_blank" | "_parent" | "_top";
  className?: string;
}

export function TextLink(args: AppLinkI) {
  return (
    <Link
      href={args.href}
      target={args.target ?? "_blank"}
      rel="noopener noreferrer"
      className={twMerge("text-primary-600 underline", args.className)}
    >
      {args.children}
    </Link>
  );
}
