"use client"

import { twJoin } from "tailwind-merge";


export type cardSubtitleProps = {
    children?: React.ReactNode;
    className?: string;
}

export default function CardSubtitle({ children, className }: cardSubtitleProps) {
    return (
        <span className={twJoin('text-white text-m-regular', className)}>
            {children}
        </span>
    )
}
