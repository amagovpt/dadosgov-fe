"use client"

import { twJoin } from "tailwind-merge";

export type cardDescriptionProps = {
    children?: React.ReactNode;
    className?: string;
}


export default function CardDescription({ children, className }: cardDescriptionProps) {
    return (
        <span className={twJoin('text-neutral-500 text-s-regular', className)}>
            {children}
        </span>
    )
}
