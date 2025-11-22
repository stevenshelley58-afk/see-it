# Shopify Admin Frontend

## Merchant Flows

### Install and Setup

1. Merchant installs See It and completes OAuth; the backend creates the `shops` row, stores the access token, and registers webhooks (`app/uninstalled`, GDPR topics, `products/update`).
2. Setup wizard guides the merchant through:
   - Selecting See It scope (all products, selected collections, or manual).
   - Optionally running initial product prep for selected items.
   - Adding the See It block to the theme via the Theme Editor.

### Product Asset Preparation

Per-product admin screen shows:

- Shopify product images (fetched via Admin GraphQL).
- Existing `product_assets` entries with thumbnail, status, and prompt version.
- Actions:
  - “Prepare for See It” for selected images.
  - “Set as default See It asset” (updates metafield `default_asset_id`).
  - “Regenerate asset” (requeues prep).

Behaviour:

- Triggering prep calls `POST /api/products/:id/prepare`, which inserts rows with `status = pending`.
- Background processing invokes the image service (`/product/prepare`), then updates status to `ready` and fills `prepared_image_url`. Failures set `status = failed`.
- When Shopify emits `products/update`, the backend compares current Shopify image IDs against `product_assets`.
  - If the source image ID is missing, mark as `orphaned`.
  - If the product data changed but image exists, mark as `stale`.

### Settings and Usage

- Displays default `style_preset`, `enable_auto_prep_missing_assets`, and other configuration flags stored in `shops.config` or dedicated columns.
- Read-only quota information (`plan`, `daily_quota`, `monthly_quota`, and current usage from `usage_daily`).
- Billing upgrades handled via Shopify Billing API; UI links out or initiates upgrade flows.

## Data Dependencies

- Admin GraphQL for product listings, images, and metafields (`see_it.*` namespace).
- Embedded app session tokens for authenticated API calls.
- Backend-sourced data for `product_assets`, `usage_daily`, quotas, and immutable schema described in `03_SCHEMA_AND_METADATA.md`.

## Endpoint Interactions

- `GET /api/products` to populate the product list with See It statuses.
- `GET /api/products/:id/assets` to retrieve asset rows and statuses.
- `POST /api/products/:id/prepare` to queue product image preparation.
- `POST /api/products/:id/assets/:asset_id/default` to set default assets (updates metafields through the backend).
- `GET /api/settings` / `POST /api/settings` to display and persist configuration fields.
- Backend handles all interactions with `04_API_CONTRACTS.md` app proxy and image service endpoints; the admin never calls them directly.

## UX State Machine

### Prepare Button States

- `idle` → default when asset has not been queued.
- `preparing` → after triggering prep; UI shows spinner/disabled state until status updates.
- `ready` → after successful image service completion; display prepared thumbnail and actions.
- `failed` → when image service returns an error; surface retry option and error details.

Transitions are driven by polling `product_assets` status or receiving websocket/long-poll updates.

### Stale Asset Handling

- When backend marks an asset as `stale`, the UI flags it visually and prompts the merchant to re-run prep.
- Until regenerated, storefront can continue using existing `prepared_image_url`, but admin should highlight the need for refresh.
- Batch stale-handling UX (auto re-prep, bulk actions) is deferred beyond MVP but should not require contract changes.

