"use client"
import { Anchor } from '@ama-pt/agora-design-system'
import Image from 'next/image'
import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

export interface SimpleCardImageProps {
    img?: {
        src: string,
        alt?: string
    },
    title: string,
    description?: string | ReactNode,
    link?: {
        href: string,
        text: string
    }
    className?: string
}

export default function SimpleCardImage(args: SimpleCardImageProps) {
    return (
        <div className={twMerge("w-full h-full bg-neutral-100 flex flex-col gap-16 p-32", args.className)}>
            {args.img && (<Image src={args.img.src} alt={args.img.alt || ""} width={126} height={33} />)}
            <span className='text-l-bold'>
                {args.title}
            </span>
            <span className='text-m-regular'>
                {args.description}
            </span>
            {args.link &&
                (<div>
                    <Anchor href={args.link.href} variant="primary" appearance="link" trailingIcon="agora-line-arrow-right-circle" trailingIconHover="agora-solid-arrow-right-circle" hasIcon={true}>
                        {args.link.text}
                    </Anchor>
                </div>)
            }
        </div>
    )
}
