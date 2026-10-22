interface GoogleConsentDefaultProps {
    nonce?: string;
}


export default function GoogleConsentDefault({ nonce }: GoogleConsentDefaultProps) {
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
                  ad_personalization: 'denied'
                });
              `,
            }}
        />
    );
}
