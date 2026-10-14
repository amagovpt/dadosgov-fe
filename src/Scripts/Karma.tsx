interface KarmaAnalyticsProps {
    nonce?: string;
}

export default function KarmaAnalytics({ nonce }: KarmaAnalyticsProps) {

    const KARMAIsActive = true; // process.env.NEXT_PUBLIC_KARMA_IS_ACTIVE === "true";
    const KARMA_ID = process.env.NEXT_PUBLIC_KARMA_ID || "";

    if (!KARMAIsActive || !KARMA_ID) return null;

    return (
        <script
            id="usercentrics-cmp"
            src="https://web.cmp.usercentrics.eu/ui/loader.js"
            data-draft="true"
            data-settings-id={KARMA_ID}
            nonce={nonce}
            async
        />
    );
}
