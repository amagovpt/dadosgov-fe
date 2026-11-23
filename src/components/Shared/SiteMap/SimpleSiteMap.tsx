"use client";
import { Anchor, AnchorProps } from '@ama-pt/agora-design-system';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

export type SimpleSiteMap = {
    title?: string;
    anchor: AnchorProps[];
    className?: string;
}

const normalizeId = (href?: string) => (href ?? "").replace(/^#/, "");

export default function SimpleSiteMap(props: SimpleSiteMap) {
    const [activeId, setActiveId] = useState<string>("");

    const ids = props.anchor.map((anchor) => normalizeId(anchor.href)).filter(Boolean);

    // after mount, sync with the current URL hash (avoids SSR/client mismatch)
    useEffect(() => {
        const initialId = normalizeId(window.location.hash);
        const isKnown = props.anchor.some((anchor) => normalizeId(anchor.href) === initialId);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveId(isKnown ? initialId : "");
    }, [props.anchor]);

    useEffect(() => {
        const elements = ids
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);
        if (!elements.length) return;

        // Wait for native anchor scrolling before tracking sections passed on the way.
        // Resolves for example open license page on correct section when the page is loaded with a hash in the URL.
        let requestedId = normalizeId(window.location.hash);
        if (!elements.some((element) => element.id === requestedId)) requestedId = "";

        const visible = new Set<string>();
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) =>
                    entry.isIntersecting
                        ? visible.add(entry.target.id)
                        : visible.delete(entry.target.id)
                );
                if (requestedId) {
                    if (!visible.has(requestedId)) return;
                    setActiveId(requestedId);
                    requestedId = "";
                    return;
                }
                const next = ids.find((id) => visible.has(id));
                if (next) setActiveId(next);
            },
            { rootMargin: "-180px 0px -70% 0px", threshold: 0 }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.anchor]);

    useEffect(() => {
        if (activeId) {
            window.history.replaceState(window.history.state, "", `#${activeId}`);
        }
    }, [activeId]);

    return (
        <div className={twMerge("w-full h-fit flex flex-col gap-16 sticky top-120 self-start [&_.children-wrapper]:text-m-bold!", props.className)}>
            {props.title && (
                <span className="text-l-bold">{props.title}</span>
            )}
            <div className=" flex flex-col">
                {props.anchor.map((anchor, index) => {
                    const isActive = normalizeId(anchor.href) === (activeId || ids[0]);
                    return (
                        <Anchor
                            key={index}
                            {...anchor}
                            aria-current={isActive ? "page" : undefined}
                            className={`justify-start! px-16! py-16!  ${isActive ? " [&_.children-wrapper]:text-primary-600! bg-primary-100 border-l-4 border-l-primary-600" : ""}`}
                            variant='neutral'
                            appearance='link'
                        />
                    );
                })}
            </div>
        </div>
    )
}
