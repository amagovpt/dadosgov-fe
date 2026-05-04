"use client"
import { twJoin } from "tailwind-merge";


export type cardTitleProps = {
    children?: React.ReactNode;
    className?: string;
}

export default function CardTitle({ children, className }: cardTitleProps) {
    return (
        <span className={twJoin('text-white text-l-semibold', className)}>
            {children}
        </span>
    )
}
