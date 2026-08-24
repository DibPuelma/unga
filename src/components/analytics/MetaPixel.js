import { useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';

// Meta Pixel base code, mounted once from pages/_app.js so it loads on every
// page (landing, auth, app) exactly one time. The snippet itself is Meta's
// official one; `if(f.fbq)return` makes it a no-op on re-execution.
//
// Conversions are NOT fired from here — see src/helpers/metaPixel.js
// (trackMetaEvent) and pages/auth/register.js.

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function MetaPixel() {
  const router = useRouter();

  useEffect(() => {
    if (!META_PIXEL_ID) return undefined;

    // The base code fires PageView on the initial load only. Client-side
    // navigations in Next.js never reload the page, so they need their own.
    const trackPageView = () => {
      if (typeof window.fbq === 'function') window.fbq('track', 'PageView');
    };

    router.events.on('routeChangeComplete', trackPageView);
    return () => router.events.off('routeChangeComplete', trackPageView);
  }, [router.events]);

  // Missing env var (local dev, previews): render nothing rather than
  // initializing a pixel with `undefined`.
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script
        id="meta-pixel-base"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
