import type { Metadata } from 'next';
import Script from 'next/script';

import AnalyticsBridge from '../components/AnalyticsBridge';
import { gaMeasurementId, segmentWriteKey } from '../lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: 'See It In Your Home',
  description: 'Visualize products inside your space in seconds.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {gaMeasurementId ? (
          <>
            <Script
              id="ga4-loader"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            />
            <Script id="ga4-config" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { send_page_view: false });
              `}
            </Script>
          </>
        ) : null}
        {segmentWriteKey ? (
          <Script id="segment-loader" strategy="afterInteractive">
            {`!function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","page","identify","reset","group","track","ready","alias","debug","pageview","once","off","on"];analytics.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);analytics.push(e);return analytics}};for(var t=0;t<analytics.methods.length;t++){var e=analytics.methods[t];analytics[e]=analytics.factory(e)}analytics.load=function(t){var e=document.createElement("script");e.type="text/javascript";e.async=!0;e.src="https://cdn.segment.com/analytics.js/v1/"+t+"/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(e,n)};analytics.SNIPPET_VERSION="4.15.3";analytics.load("${segmentWriteKey}");}}();`}
          </Script>
        ) : null}
        <AnalyticsBridge />
        {children}
      </body>
    </html>
  );
}
