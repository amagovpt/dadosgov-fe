interface KarmaAnalyticsProps {
    settingsId: string;
    draft: boolean;
    nonce?: string;
}

export default function KarmaAnalytics({ settingsId, draft, nonce }: KarmaAnalyticsProps) {
    if (!settingsId) return null;

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-sync-scripts -- must block parsing so it runs before any other script (Usercentrics requirement) */}
            <script
                id="usercentrics-autoblocker"
                src="https://web.cmp.usercentrics.eu/modules/autoblocker.js"
                nonce={nonce}
            />
            <script
                id="usercentrics-cmp"
                src="https://web.cmp.usercentrics.eu/ui/loader.js"
                data-settings-id={settingsId}
                {...(draft ? { "data-draft": "true" } : {})}
                nonce={nonce}
                defer
            />
        </>
    );
}
