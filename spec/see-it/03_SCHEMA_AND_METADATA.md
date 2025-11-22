# Schema and Metadata

## Database Tables

### `shops`

```text
Columns:
  - id (uuid, pk)
  - shop_domain (text, unique, not null)
  - shopify_shop_id (text, not null)
  - access_token (text, not null)
  - plan (text, not null)             -- values: "free", "pro", etc.
  - monthly_quota (integer, not null)
  - daily_quota (integer, not null)
  - created_at (timestamptz, not null, default now())
  - uninstalled_at (timestamptz, null)

Relations:
  - product_assets (1→many)
  - room_sessions (1→many)
  - render_jobs (1→many)
  - usage_daily (1→many)
```

### `product_assets`

```text
Columns:
  - id (uuid, pk)
  - shop_id (uuid, fk → shops.id)
  - product_id (text, not null)          -- Shopify GID
  - variant_id (text, null)              -- Shopify GID
  - source_image_id (text, not null)     -- Shopify image ID/GID
  - source_image_url (text, not null)
  - prepared_image_url (text, null)      -- transparent PNG
  - status (text, not null)              -- "pending" | "ready" | "failed" | "stale" | "orphaned"
  - prep_strategy (text, not null)       -- "batch" | "fallback" | "manual"
  - prompt_version (integer, not null)   -- current product prep prompt version
  - created_at (timestamptz, not null)
  - updated_at (timestamptz, not null)

Constraints:
  - index on (shop_id, product_id)

Relations:
  - shop (many→1, cascade on delete)
  - render_jobs (1→many)
```

### `room_sessions`

```text
Columns:
  - id (uuid, pk)                        -- room_session_id
  - shop_id (uuid, fk → shops.id)
  - original_room_image_url (text, null)
  - cleaned_room_image_url (text, null)
  - created_at (timestamptz, not null)
  - expires_at (timestamptz, not null)
  - last_used_at (timestamptz, null)

Relations:
  - shop (many→1, cascade on delete)
  - render_jobs (1→many)
```

### `render_jobs`

```text
Columns:
  - id (uuid, pk)
  - shop_id (uuid, fk → shops.id)
  - product_id (text, not null)
  - variant_id (text, null)
  - product_asset_id (uuid, fk → product_assets.id)
  - room_session_id (uuid, fk → room_sessions.id)
  - placement_x (double precision, not null)
  - placement_y (double precision, not null)
  - placement_scale (double precision, not null)
  - style_preset (text, null)
  - quality (text, null)
  - config_json (jsonb, null)            -- serialized `config` payload
  - status (text, not null)              -- "queued" | "processing" | "completed" | "failed"
  - image_url (text, null)
  - model_id (text, null)
  - prompt_id (text, null)
  - prompt_version (integer, null)
  - error_code (text, null)
  - error_message (text, null)
  - created_at (timestamptz, not null)
  - completed_at (timestamptz, null)

Relations:
  - shop (many→1, cascade on delete)
  - product_asset (many→1)
  - room_session (many→1)
```

### `usage_daily`

```text
Columns:
  - id (uuid, pk)
  - shop_id (uuid, fk → shops.id)
  - date (date, not null)
  - prep_renders (integer, not null, default 0)
  - cleanup_renders (integer, not null, default 0)
  - composite_renders (integer, not null, default 0)

Constraints:
  - unique (shop_id, date)

Relations:
  - shop (many→1, cascade on delete)
```

## Enum and Status Rules

- `product_assets.status` is one of `pending`, `ready`, `failed`, `stale`.
- `product_assets.prep_strategy` is one of `batch`, `fallback`, `manual`.
- `render_jobs.status` is one of `queued`, `processing`, `completed`, `failed`.
- `shops.plan` values map to billing tiers (`free`, `pro`, `enterprise`, etc.) and drive quota numbers.

## Shopify Metafields

Namespace: `see_it`.

Keys:

- `enabled` (boolean) — toggles the feature per product.
- `default_asset_id` (string) — stores `product_assets.id` that the storefront should use by default.
- `style_preset` (string, optional) — overrides default style for the product.

Define metafields via `shopify.app.toml` so merchants can manage them in Admin.

