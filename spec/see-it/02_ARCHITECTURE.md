# Architecture

## System Components

### Shopify App (Backend + Admin UI)

- Node/TypeScript service based on the Shopify React Router app template.
- Owns OAuth, session handling, Admin GraphQL access, webhooks, billing, app proxy routes, and quota enforcement.
- Communicates with the image service for asset preparation and compositing.

### Theme App Extension (Storefront Widget)

- Renders the See It block on the PDP.
- Provides modal flow: Capture → Edit room → Place → Generate → Review.
- Calls app proxy JSON endpoints for all business logic and uses presigned URLs for binary uploads.

### Image Service (AI Backend)

- Stateless HTTP service (e.g., Cloud Run).
- Exposes `/product/prepare`, `/room/cleanup`, and `/scene/composite`.
- Wraps Gemini 3 Pro Image (and optional fallback) and always returns image URLs.

### Object Storage

- GCS, S3, or R2 buckets/prefixes segmented per shop.
- Holds all room captures, prepared assets, masks, and composites referenced by URLs in the database.

## Storage Layout

Treat these prefixes as fixed:

```text
room-original/{shop_id}/{room_session_id}/{uuid}.jpg
room-cleaned/{shop_id}/{room_session_id}/{uuid}.jpg
product-prepared/{shop_id}/{product_id}/{asset_id}.png
composites/{shop_id}/{render_job_id}.jpg
```

Retention is managed via storage lifecycle rules:

- Room originals: retain 24 hours.
- Room cleaned: retain 24–72 hours.
- Composites: retain 30 days.
- Product prepared assets: retain indefinitely or until shop uninstall/cleanup.

## Security & Limits

- **App Proxy Rate Limiting**: The app must enforce a rate limit per `room_session_id` (e.g., max 5 renders per minute) to prevent quota draining attacks.
- **HMAC Validation**: All proxy requests must verify the Shopify HMAC signature.

## Request Flows

### Storefront → App Proxy → Image Service → Storage

1. Shopper interacts with the theme extension.
2. Extension calls `/app-proxy/room/start` to obtain a `room_session_id`, presigned upload URL, and future storage location.
3. Frontend uploads the binary directly to object storage using the presigned URL.
4. Extension calls `/app-proxy/room/confirm`; the app records the storage URL on the room session.
5. Shopper positions the ghost overlay and triggers `/app-proxy/render`.
6. App creates a render job, enforces quotas, resolves assets, and calls the image service `/scene/composite`.
7. Image service writes the composite into storage and returns the URL; app updates the job status.
8. Frontend polls `/app-proxy/render/:job_id` until completed or failed, then displays the composite.

### Admin → App → Image Service → Storage

1. Merchant uses the embedded admin to select product imagery.
2. Admin UI calls app endpoints (e.g., `/api/products/:id/prepare`).
3. App inserts `product_assets` rows (status `pending`) and requests presigned URLs as needed.
4. Background worker or job processor calls image service `/product/prepare` with source and destination URLs.
5. Image service writes prepared PNGs to storage and returns metadata.
6. App updates `product_assets` (status `ready`, `prepared_image_url`, prompt/version) and, if configured, updates metafields via Admin GraphQL.

