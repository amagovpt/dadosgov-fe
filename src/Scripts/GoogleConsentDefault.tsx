interface GoogleConsentDefaultProps {
    gaId?: string;
    nonce?: string;
}

export default function GoogleConsentDefault({ gaId, nonce }: GoogleConsentDefaultProps) {
    const config = gaId
        ? `window.gtag('js', new Date());
                window.gtag('config', ${JSON.stringify(gaId)});`
        : "";

    return (
        <script
            id="google-consent-default"
            data-uc-allowed="true"
            nonce={nonce}
            // The autoblocker stamps attributes (`type`) on head scripts before hydration.
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
                window.gtag('consent', 'default', {
                  ad_storage: 'denied',
                  analytics_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  wait_for_update: 500
                });
                ${config}
              `,
            }}
        />
    );
}
