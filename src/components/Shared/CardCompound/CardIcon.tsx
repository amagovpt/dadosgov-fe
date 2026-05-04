"use client"

import { twJoin } from "tailwind-merge";
import Icon from "../../Primitives/Icon"

export type cardIconProps = {
    icon: string;
    className?: string;
}

export default function CardIcon({ icon, className }: cardIconProps) {
    return (
        <div className={twJoin('bg-primary-100 p-[16px] w-[56px] h-[56px] rounded-[8px] flex items-center justify-center', className)}>
            <Icon name={icon} />
        </div>
    )
}
