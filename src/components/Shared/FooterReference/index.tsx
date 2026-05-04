
"use client";
import { twJoin } from "tailwind-merge"

export type FooterReferenceProps = {
  text?: string
  period: string
  className?: string
}


export default function FooterReference({ text = "Período de referência", period, className }: FooterReferenceProps) {
  return (
    <div className={twJoin('flex flex-row gap-8 items-baseline justify-end', className)}>
      <span className='text-neutral-500 text-m-regular text-reference'>
        {text}:
      </span>
      <span className='text-white text-m-regular period-date'>
        {period}
      </span>
    </div>
  )
}
