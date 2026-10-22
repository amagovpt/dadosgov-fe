interface GoogleAnalyticsProps {
    gaId: string;
    nonce?: string;
}

export default function GoogleAnalytics({ gaId, nonce }: GoogleAnalyticsProps) {
    if (!gaId) return null;
    const src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    return (
        <script
            id="google-analytics"
            nonce={nonce}
            dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
                window.gtag('js', new Date());
                window.gtag('config', ${JSON.stringify(gaId)});
                (function(){
                  var s = document.createElement('script');
                  s.async = true;
                  s.src = ${JSON.stringify(src)};
                  document.head.appendChild(s);
                })();
              `,
            }}
        />
    );
}
