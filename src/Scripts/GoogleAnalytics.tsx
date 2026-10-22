"use client";

import { useEffect } from "react";

interface GoogleAnalyticsProps {
    gaId: string;
}

/** The slice of the Usercentrics v3 `ConsentDetails` this component reads. */
interface UcConsentDetails {
    services?: Record<string, { name?: string; consent?: { given?: boolean } }>;
}

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
        __ucCmp?: { getConsentDetails?: () => Promise<UcConsentDetails> };
    }
}

const GA_SERVICE_NAME = /^google analytics/i;

export function isAnalyticsConsented(details: UcConsentDetails | undefined): boolean {
    return Object.values(details?.services ?? {}).some(
        (service) => GA_SERVICE_NAME.test(service.name ?? "") && service.consent?.given === true
    );
}

function gtag(...args: unknown[]) {
    window.dataLayer = window.dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    window.gtag = window.gtag || function () { window.dataLayer!.push(arguments); };
    window.gtag(...args);
}


export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
    useEffect(() => {
        if (!gaId) return;
        let loaded = false;
        let granted = false;

        const apply = (details: UcConsentDetails | undefined) => {
            const consented = isAnalyticsConsented(details);
            if (consented === granted) return;
            granted = consented;
            gtag("consent", "update", { analytics_storage: consented ? "granted" : "denied" });
            if (!consented || loaded) return;
            loaded = true;
            const script = document.createElement("script");
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
            document.head.appendChild(script);
            gtag("js", new Date());
            gtag("config", gaId);
        };


        const onConsent = (event: Event) => apply((event as CustomEvent<UcConsentDetails>).detail);
        window.addEventListener("UC_CONSENT", onConsent);
        window.__ucCmp?.getConsentDetails?.().then(apply, () => undefined);

        return () => window.removeEventListener("UC_CONSENT", onConsent);
    }, [gaId]);

    return null;
}
