import React from "react";
import { twMerge } from "tailwind-merge";

export interface IInfoBlockHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export default function InfoBlockHeader({
  children,
  className,
}: IInfoBlockHeaderProps) {
  return (
    <div className={twMerge("flex flex-col gap-24 w-full", className)}
      data-testid="info-block-header">
      {children}
    </div>
  );
}
