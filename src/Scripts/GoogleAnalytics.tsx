interface GoogleAnalyticsProps {
    nonce?: string;
}

export default function GoogleAnalytics({ nonce }: GoogleAnalyticsProps) {

    const GAIsActive = true; // process.env.NEXT_PUBLIC_GA_IS_ACTIVE === "true";
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

    if (!GAIsActive || !GA_ID) return null;
    return (
        <>
            <script
                src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
                nonce={nonce}
                async
            />
            <script
                id="google-analytics"
                nonce={nonce}
                dangerouslySetInnerHTML={{
                    __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', ${JSON.stringify(GA_ID)});
              `,
                }}
            />
        </>
    );
}
