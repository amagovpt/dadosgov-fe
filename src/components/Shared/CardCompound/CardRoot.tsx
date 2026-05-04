"use client";

import { twMerge } from "tailwind-merge";

export type cardRootProps = {
    children?: React.ReactNode;
    className?: string;
    key?: string | number;
}

export default function CardRoot({ children, className, key }: cardRootProps) {
    return (
        <div className={twMerge('flex flex-col', className)} key={key}>
            {children}
        </div>
    )
}
