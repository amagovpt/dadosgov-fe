interface GoogleAnalyticsProps {
    gaId: string;
}

/**
 * Must match the service name in the Usercentrics panel exactly: the CMP only
 * activates a `data-usercentrics` script whose name it knows.
 */
export const GA_USERCENTRICS_SERVICE = "Google Analytics 4";

/**
 * gtag.js, held back by Usercentrics' own manual blocking: `type="text/plain"`
 * keeps the browser from running it, and the CMP flips it on once the visitor
 * consents to the GA service. This works wherever the autoblocker ends up in
 * <head> (Next/React always hoist their own chunks ahead of it). The `js` /
 * `config` commands are queued by GoogleConsentDefault.
 */
export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
    if (!gaId) return null;

    return (
        <script
            id="google-analytics"
            type="text/plain"
            data-usercentrics={GA_USERCENTRICS_SERVICE}
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
            // Not `async`: React 19 hoists async scripts as resources and may
            // preload them, which would reach Google before consent.
            defer
            // Usercentrics rewrites `type` when it activates the script.
            suppressHydrationWarning
        />
    );
}
