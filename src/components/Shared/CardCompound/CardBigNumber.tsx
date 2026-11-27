"use client"
import { formatNumberExtense } from '@/utils/numberConverter'
import { twJoin } from 'tailwind-merge'

export type CardBigNumberProps = {
    className?: string,
    number: number | string,
    locale?: string,
    type?: "qtd" | "value",
    unit?: string
}


export default function CardBigNumber({ number, className, locale, type = "value", unit }: CardBigNumberProps) {
    const { extense, numberResolve } = formatNumberExtense(number, locale)
    return (
        <div className={twJoin('text-white flex gap-8 items-baseline', className)}>
            <span className='text-3xl-bold number-resolve'>
                {type === "qtd" ? number.toLocaleString("de-DE") : numberResolve}
            </span>
            {type === "value" && (
                <span className='text-xl-light extense-resolve'>
                    {unit ? `${extense} ${unit}` : extense}
                </span>
            )}

        </div>
    )
}
