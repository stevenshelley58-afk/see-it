QA Checklist
============

Functional
----------
- Launch modal from Shopify PDP across primary browsers (Mobile Safari, Chrome Android, Chrome Desktop).
- Capture photo with device camera; verify crop, placement, and preview flow completes.
- Upload existing photo; confirm client-side downscale and preview success.
- Retry generation after failure; ensure graceful fallback message and reattempt.
- Receive session email with generated previews and correct product title.
- Decline email consent and ensure no request fires; accept consent and confirm checkbox focus states.

Performance
-----------
- Largest upload (1024px JPEG) completes signed POST in under 3s on LTE.
- Preview generation latency ≤ 12s at P50 and ≤ 20s at P95 (monitor via Cloud Logging).
- Frontend bundle < 200KB gzipped; verify Next.js analyzer.

Accessibility
-------------
- All interactive controls reachable via keyboard and have visible focus.
- Color contrast meets WCAG AA for primary/secondary buttons and instruction banner.
- Screen reader announces modal transitions and instruction banner.

Security & Privacy
------------------
- Confirm CORS restricts to storefront domains.
- Ensure sessions without email purge after 30 days via bucket + Firestore TTL.
- Verify signed upload URLs expire within 10 minutes and are single-use.
- Validate email consent copy + checkbox align with legal guidance and required before submission.

Analytics
---------
- Validate `seeit-analytics` events fire for CTA click, photo captured, preview generated/failed, email sent.
- Confirm GA4/Segment ingestion from `window.dataLayer`.

Regression
----------
- Smoke test after dependency updates (Next.js, Vertex SDK, Shopify API).
- Rerun unit/integration suite before deployment.

