Analytics Events
================

Client-Side (`window.dataLayer`)
--------------------------------
- `seeit_cta_click` — payload: `{ action }`
  - `action`: `take_photo`, `upload_photo`, `adjust_preview`, `back_to_store`
- `seeit_photo_captured` — payload: `{ source }`
  - `source`: `camera` or `library`
- `seeit_photo_cropped`
- `seeit_placement_submitted` — payload: `{ sessionId }`
- `seeit_preview_generated` — payload: `{ sessionId }`
- `seeit_preview_failed` — payload: `{ message }`
- `seeit_email_sent` — payload: `{ sessionId, status }`
- `seeit_guides_toggle` — payload: `{ enabled }`

Destinations
------------
- **Google Analytics 4** — configure `NEXT_PUBLIC_GA4_MEASUREMENT_ID`. The shared analytics bridge (`frontend/src/components/AnalyticsBridge.tsx`) loads the gtag runtime, suppresses implicit `page_view`, and forwards every `seeit_*` event as a GA4 `event`.
- **Segment** — configure `NEXT_PUBLIC_SEGMENT_WRITE_KEY`. Store the production key in Vercel and the Shopify admin `.env`; the analytics bridge will emit both `analytics.page()` and `analytics.track()` calls mirroring the GA4 payloads.
- **Data Layer** — `frontend/src/lib/analytics.ts` continues to push each event into `window.dataLayer` for downstream GTM recipes.

Server-Side
-----------
- Cloud Run logs `generate-preview` success/failure with sessionId.
- Postmark email success logged via Pino with `sessionId` and email.

Dashboards
----------
- GA4 funnel: CTA click → preview generated → email sent.
- Looker Studio report using BigQuery log sink for generation latency.

Operational Notes
-----------------
- GA4 + Segment scripts are lazy-loaded from `frontend/src/app/layout.tsx`. If a destination is not configured, its loader is skipped automatically.
- Events are deduplicated client-side; the analytics bridge removes the `event` property before forwarding payloads to the destinations.

