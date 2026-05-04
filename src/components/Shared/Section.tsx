import React from "react";
import { twMerge } from "tailwind-merge";

export interface ISectionProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export default function Section({ children, className,id }: ISectionProps) {
  return (
    <section
      className={twMerge("w-full h-full", className)}
      id={id}
      data-testid={id}
    >
      {children}
    </section>
  );
}
