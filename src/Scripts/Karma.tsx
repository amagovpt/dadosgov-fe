"use client";
import Script from 'next/script'

export default function KarmaAnalytics() {

    const KARMAIsActive = true; // process.env.NEXT_PUBLIC_KARMA_IS_ACTIVE === "true";
    const KARMA_ID = process.env.NEXT_PUBLIC_KARMA_ID || "";

    return KARMAIsActive && (
            <Script
                id="usercentrics-cmp"
                src={`"https://web.cmp.usercentrics.eu/ui/loader.js"`}
                strategy="afterInteractive"
                data-draft="true"
                data-settings-id={KARMA_ID}
            />

    );
}
