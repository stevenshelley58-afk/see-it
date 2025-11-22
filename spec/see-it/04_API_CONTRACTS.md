# API Contracts

All routes below are treated as frozen contracts for Codex. Request and response bodies are JSON unless noted. Status fields reference enums defined in `03_SCHEMA_AND_METADATA.md`.

## App Proxy Endpoints (Storefront → App)

Auth: Shopify app proxy HMAC validation on every request.

### `POST /app-proxy/room/start`

Returns a new room session with presigned upload details.

Request:

```json
{
  "product_id": "gid://shopify/Product/123"
}
```

Response:

```json
{
  "room_session_id": "uuid",
  "upload_url": "https://bucket-presigned-upload-url",
  "room_image_future_url": "https://bucket/room-original/{shop_id}/{room_session_id}/{file}.jpg"
}
```

Frontend uploads the binary directly to `upload_url`.

### `POST /app-proxy/room/confirm`

Confirms the room upload and records the stored URL on the session.

Request:

```json
{
  "room_session_id": "uuid"
}
```

Response:

```json
{
  "ok": true
}
```

Backend sets `room_sessions.original_room_image_url` to the value returned in `/room/start`.

### `POST /app-proxy/room/cleanup`

Stubbed for MVP; used when the erase tool is available.

Request:

```json
{
  "room_session_id": "uuid",
  "mask_url": "https://bucket/room-original/...-mask.png"
}
```

Response:

```json
{
  "room_session_id": "uuid",
  "cleaned_room_image_url": "https://bucket/room-cleaned/..."
}
```

### `POST /app-proxy/render`

Creates a render job that triggers the image service composite.

Request:

```json
{
  "product_id": "gid://shopify/Product/123",
  "variant_id": "gid://shopify/ProductVariant/456",
  "room_session_id": "uuid",
  "placement": {
    "x": 0.5,
    "y": 0.5,
    "scale": 1.0
    // future: "rotation": 0.0
  },
  "config": {
    "style_preset": "neutral",
    "quality": "standard",
    "extras": {}
  }
}
```

Response:

```json
{
  "job_id": "uuid"
}
```

App records `render_jobs` with status `queued`, persists the placement/config, and hands off to the image service.

### `GET /app-proxy/render/:job_id`

Returns render job status (and image URL when ready).

Response:

```json
{
  "job_id": "uuid",
  "status": "completed",
  "image_url": "https://bucket/composites/...",
  "error_code": null,
  "error_message": null
}
```

`status` may be `queued`, `processing`, `completed`, or `failed`.

## Admin API (Internal App Endpoints)

Auth: Shopify session tokens from the embedded admin.

Shapes can evolve, but keep the following stable when possible:

- `GET /api/products` — list products with See It status.
- `GET /api/products/:id/assets` — list `product_assets` for a product.
- `POST /api/products/:id/prepare` — trigger prep for selected Shopify image IDs.
- `POST /api/products/:id/assets/:asset_id/default` — set the metafield default asset.
- `GET /api/settings` / `POST /api/settings` — read and update See It settings (style preset, automation flags, quotas display).

## Image Service Endpoints (App → Image Service)

Auth: internal service credentials (TBD). All endpoints return URLs, never binary blobs.

### `POST /product/prepare`

Request:

```json
{
  "source_image_url": "https://cdn.shopify.com/...",
  "shop_id": "uuid",
  "product_id": "gid://shopify/Product/123",
  "asset_id": "uuid",
  "prompt": {
    "id": "product_prep",
    "version": 1
  },
  "model": {
    "id": "gemini-3-pro-image",
    "resolution": "standard",
    "overrides": {}
  }
}
```

Response:

```json
{
  "prepared_image_url": "https://bucket/product-prepared/{...}.png"
}
```

Result must be a transparent PNG containing only the product.

### `POST /room/cleanup`

Request:

```json
{
  "room_image_url": "https://bucket/room-original/...",
  "mask_url": "https://bucket/room-original/...-mask.png",
  "prompt": {
    "id": "room_cleanup",
    "version": 1
  },
  "model": {
    "id": "gemini-3-pro-image",
    "resolution": "standard",
    "overrides": {}
  }
}
```

Response:

```json
{
  "cleaned_room_image_url": "https://bucket/room-cleaned/..."
}
```

### `POST /scene/composite`

Request:

```json
{
  "prepared_product_image_url": "https://bucket/product-prepared/...",
  "room_image_url": "https://bucket/room-cleaned/...",
  "placement": {
    "x": 0.5,
    "y": 0.5,
    "scale": 1.0
    // future: "rotation": 0.0
  },
  "prompt": {
    "id": "scene_composite",
    "version": 1,
    "style_preset": "neutral"
  },
  "model": {
    "id": "gemini-3-pro-image",
    "resolution": "standard",
    "overrides": {}
  }
}
```

Response:

```json
{
  "image_url": "https://bucket/composites/{render_job_id}.jpg"
}
```

Image service is responsible for writing output to storage paths defined in `02_ARCHITECTURE.md` and logging prompt/model metadata.

