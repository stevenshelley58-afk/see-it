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

Server-Side
-----------
- Cloud Run logs `generate-preview` success/failure with sessionId.
- Postmark email success logged via Pino with `sessionId` and email.

Dashboards
----------
- GA4 funnel: CTA click → preview generated → email sent.
- Looker Studio report using BigQuery log sink for generation latency.

