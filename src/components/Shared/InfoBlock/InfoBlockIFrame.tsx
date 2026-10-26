"use client"
import { useMemo, useSyncExternalStore } from 'react'
import { twJoin } from 'tailwind-merge';

export type IInfoBlockIFrame = {
    className?: string,
    src: string,
}

export default function InfoBlockIFrame({
    className,
    src,
}: IInfoBlockIFrame) {

    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    const embedUrl = useMemo(() => {
        try {
            const url = new URL(src);
            url.searchParams.set('chromeless', '1');
            url.searchParams.set('navContentPaneEnabled', 'false');
            url.searchParams.set('filterPaneEnabled', 'false');
            url.searchParams.set('actionBarEnabled', 'false');
            url.searchParams.set('pagesVisibility', 'false');
            url.searchParams.set('noSignInButton', 'true');
            url.searchParams.set('hints', 'false');
            url.searchParams.set('showcaseSampleData', 'false');
            return url.toString();
        } catch {
            return src;
        }
    }, [src])



    return (
        <div className={twJoin("relative overflow-hidden flex item-center justify-center h-full", className)}>
            {mounted && (
                <iframe
                    src={embedUrl}
                    className='absolute top-0 left-0 w-full h-full'
                    style={{
                        clipPath: 'inset(0 0 118px 0)',
                        top: 0,
                    }}
                    allow="fullscreen"
                />
            )}
        </div>
    )
}
