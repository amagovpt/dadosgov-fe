"use client";
import { Anchor, AnchorProps } from '@ama-pt/agora-design-system';
import { useEffect, useState } from 'react';

export type SimpleSiteMap = {
    title?: string;
    anchor: AnchorProps[]
}

const normalizeId = (href?: string) => (href ?? "").replace(/^#/, "");

export default function SimpleSiteMap(props: SimpleSiteMap) {
    const [activeId, setActiveId] = useState<string>("");

    const ids = props.anchor.map((anchor) => normalizeId(anchor.href)).filter(Boolean);

    // after mount, sync with the current URL hash (avoids SSR/client mismatch)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveId(normalizeId(window.location.hash));
    }, []);

    useEffect(() => {
        const elements = ids
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);
        if (!elements.length) return;

        const visible = new Set<string>();
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) =>
                    entry.isIntersecting
                        ? visible.add(entry.target.id)
                        : visible.delete(entry.target.id)
                );
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
            window.history.replaceState(null, "", `#${activeId}`);
        }
    }, [activeId]);

    return (
        <div className="w-full h-fit flex flex-col gap-16 sticky top-[180px] self-start">
            {props.title && (
                <span className="text-l-bold">{props.title}</span>
            )}
            <div className=" flex flex-col">
                {props.anchor.map((anchor, index) => {
                    const isActive = normalizeId(anchor.href) === activeId;
                    return (
                        <Anchor
                            key={index}
                            {...anchor}
                            aria-current={isActive ? "page" : undefined}
                            className={`!justify-start !px-16 !py-16 [&_.children-wrapper]:!text-m-bold ${isActive ? " [&_.children-wrapper]:!text-primary-600 bg-primary-100 border-l-4 border-l-primary-600" : ""}`}
                            variant='neutral'
                            appearance='link'
                        />
                    );
                })}
            </div>
        </div>
    )
}
