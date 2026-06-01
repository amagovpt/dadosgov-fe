"use client";
import { Anchor, AnchorProps } from '@ama-pt/agora-design-system';

export type SimpleSiteMap = {
    title: string;
    anchor: AnchorProps[]
}

export default function SimpleSiteMap(props: SimpleSiteMap) {
    return (
        <div className="w-full h-full flex flex-col gap-16">
            <span className="text-l-bold">{props.title}</span>
            <div className=" flex flex-col gap-16 px-16">
                {props.anchor.map((anchor, index) => (
                    <Anchor key={index} {...anchor} className={("!justify-start  [&_.children-wrapper]:!text-m-bold")} variant='neutral' appearance='link' />

                ))}
            </div>
        </div>
    )
}
