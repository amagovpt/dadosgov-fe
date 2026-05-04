import React from "react";
import { twMerge } from "tailwind-merge";

export interface IInfoBlockContentProps {
  children?: React.ReactNode;
  className?: string;
}

export default function InfoBlockContent({
  children,
  className,
}: IInfoBlockContentProps) {
  return (
    <div
      className={twMerge(
        "grid xs:grid-cols-1 xl:grid-cols-2 gap-32 w-full",
        className
      )}
      data-testid="info-block-content"
    >
      {children}
    </div>
  );
}
