import React from "react";
import { twMerge } from "tailwind-merge";

export interface IInfoBlockRootProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export default function InfoBlockRoot({
  children,
  className,
  id,
}: IInfoBlockRootProps) {
  return (
    <div
      className={twMerge("container h-full flex flex-col gap-32", className)}
      data-testid="info-block-root"
      id={id}
    >
      {children}
    </div>
  );
}
