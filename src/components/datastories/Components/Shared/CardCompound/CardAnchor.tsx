"use client"
import { AnchorProps, Icon } from '@ama-pt/agora-design-system'
import { twJoin } from 'tailwind-merge'

export default function CardAnchor(args: AnchorProps) {
    return (
        <div className='group'>
            <a href={args.href} target={args.target}
                className={twJoin('flex items-center gap-8 text-primary-400 text-m-light group-hover:text-white', args.className)}>
                <span>{args.children}</span>
                <Icon name='agora-line-arrow-right-circle'
                    className={twJoin('fill-primary-400 group-hover:fill-white', args.className)} />
            </a>
        </div>
    )
}
