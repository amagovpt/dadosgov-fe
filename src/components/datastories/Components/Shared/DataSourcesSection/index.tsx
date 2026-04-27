"use client"
import Section from '../Section'
import { InfoBlock } from '../InfoBlock'
import { Anchor } from '@ama-pt/agora-design-system'
import { twMerge } from 'tailwind-merge'

export type DataSourcesSectionProps = {
    className?: string
    title: string
    description?: string,
    dataSources: [{
        children: string,
        href: string
    }]
}


// eslint-disable-next-line max-len
export default function DataSourcesSection({ className, title, description, dataSources }: DataSourcesSectionProps) {
    return (
        <Section className={twMerge("flex items-center justify-center bg-primary-100 py-[64px] overflow-hidden", className)}>
            <div className='z-10 container'>
                <InfoBlock.Root>
                    <InfoBlock.Content className='gap-[64px] flex flex-row'>
                        <div className='flex flex-col gap-32'>
                            <InfoBlock.Header className='gap-[8px]'>
                                <InfoBlock.Title titleLevel="h2" title={title} className='text-2xl font-bold text-primary-900' />
                                <InfoBlock.Content className='flex' >
                                    <InfoBlock.Description
                                        className=''
                                        description={description} />
                                </InfoBlock.Content>
                            </InfoBlock.Header>
                            <InfoBlock.Content>
                                <div className='flex flex-col gap-16'>
                                    {dataSources.map((source, index) => (
                                        <Anchor
                                            href={source.href}
                                            className='!justify-start !text-nowrap'
                                            target="_blank"
                                            key={index}
                                            hasIcon
                                            trailingIcon='agora-line-external-link'
                                            trailingIconActive='agora-line-external-link'
                                            trailingIconHover='agora-solid-external-link'
                                        >
                                            {source.children}
                                        </Anchor>
                                    ))}
                                </div>
                            </InfoBlock.Content>
                        </div>
                        <div className='relative w-full h-full -z-10 xl:hidden'>
                            <div className='absolute bg-primary-300 w-[373px] h-[373px] -top-[165px] rounded-[50px] left-[250px] ' />
                            <div className='absolute bg-primary-300 w-[108px] h-[108px] top-[10px] rounded-[25px] left-[108px]' />
                            <div className='absolute bg-primary-300 w-[216px] h-[216px] top-[163px] rounded-[50px]' />
                        </div>
                    </InfoBlock.Content>
                </InfoBlock.Root>
            </div>
        </Section >
    )
}
