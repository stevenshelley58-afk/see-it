# Implementation Plan

Each phase builds on the same contracts defined in this spec. MVP corresponds to Phase 1 and must respect final architecture.

## Phase 0 — Foundations

- Scope in:
  - Create all tables from `03_SCHEMA_AND_METADATA.md`.
  - Establish storage buckets/prefixes per `02_ARCHITECTURE.md`.
  - Stub app proxy endpoints and image service routes with contract-compliant responses.
  - Implement OAuth, session storage, webhook registration boilerplate.
- Explicitly out:
  - Real image processing.
  - Frontend UX beyond placeholder pages.
- Relevant docs: `02_ARCHITECTURE.md`, `03_SCHEMA_AND_METADATA.md`, `04_API_CONTRACTS.md`, `10_AGENT_GUIDELINES.md`.

## Phase 1 — MVP (Composite Happy Path)

- Scope in (see `10.1 MVP included` in `01_PRODUCT_OVERVIEW.md`):
  - Shopify React Router admin with basic product list.
  - Theme extension modal with Capture → Place → Generate flow (drag-only).
  - Presigned uploads for room originals; `room/cleanup` stubbed.
  - `/product/prepare` and `/scene/composite` implemented using Gemini 3 Pro Image.
  - Render job creation, polling, quota checks (read-only enforcement as configured).
  - Metafield default asset wiring.
- Explicitly out (items deferred yet covered by contracts):
  - Room cleanup, placement resize/rotation.
  - Batch prep, stale automation, billing upgrade UX, advanced settings.
- Relevant docs: `00_INDEX.md`, `01_PRODUCT_OVERVIEW.md`, `02_ARCHITECTURE.md`, `03_SCHEMA_AND_METADATA.md`, `04_API_CONTRACTS.md`, `05_FRONTEND_SHOPIFY_ADMIN.md`, `06_FRONTEND_THEME_EXTENSION.md`, `07_IMAGE_SERVICE_SPEC.md`, `08_PROMPTS_SPEC.md`, `10_AGENT_GUIDELINES.md`.

## Phase 2 — Room Cleanup

- Scope in:
  - Implement mask upload UX and storage.
  - Wire `/app-proxy/room/cleanup` and image service `/room/cleanup`.
  - Update admin/state handling for cleaned vs original room images.
- Explicitly out:
  - Advanced segmentation (SAM), auto-mask generation.
- Relevant docs: `02_ARCHITECTURE.md`, `04_API_CONTRACTS.md`, `06_FRONTEND_THEME_EXTENSION.md`, `07_IMAGE_SERVICE_SPEC.md`.

## Phase 3 — Placement Enhancements & Retries

- Scope in:
  - Add resize (scale) and optional rotation controls in the widget.
  - Capture failures and provide retry loops for renders and prep jobs.
- Explicitly out:
  - Multi-product placement per room session.
- Relevant docs: `04_API_CONTRACTS.md`, `06_FRONTEND_THEME_EXTENSION.md`, `05_FRONTEND_SHOPIFY_ADMIN.md`.

## Phase 4 — Batch Prep & Stale Handling

- Scope in:
  - Bulk operations for asset prep in admin (collections, auto-prep).
  - Automated stale detection and requeue when product images change.
- Explicitly out:
  - Full analytics dashboards.
- Relevant docs: `03_SCHEMA_AND_METADATA.md`, `05_FRONTEND_SHOPIFY_ADMIN.md`, `07_IMAGE_SERVICE_SPEC.md`.

## Phase 5 — Billing & Quotas

- Scope in:
  - Shopify Billing API integration for plan upgrades.
  - Enforced daily/monthly quota limits tied to `shops.plan`.
  - Usage reporting surfaced in admin.
- Explicitly out:
  - Custom external billing providers.
- Relevant docs: `03_SCHEMA_AND_METADATA.md`, `05_FRONTEND_SHOPIFY_ADMIN.md`, `10_AGENT_GUIDELINES.md`.

## Phase 6 — Style Presets & Prompt Evolution

- Scope in:
  - Surfacing style presets in admin and storefront.
  - Introducing new prompt versions while maintaining backward compatibility.
  - Updating logging to capture preset selections.
- Explicitly out:
  - User-uploaded custom prompts.
- Relevant docs: `04_API_CONTRACTS.md`, `05_FRONTEND_SHOPIFY_ADMIN.md`, `06_FRONTEND_THEME_EXTENSION.md`, `07_IMAGE_SERVICE_SPEC.md`, `08_PROMPTS_SPEC.md`.

## Phase 7 — Advanced Enhancements

- Scope in:
  - SAM-based segmentation, advanced analytics, multi-room sessions.
  - Additional AI tooling beyond core flows.
- Explicitly out:
  - Core contract changes (still anchored to this spec unless approved).
- Relevant docs: entire spec, with emphasis on `07_IMAGE_SERVICE_SPEC.md` and `08_PROMPTS_SPEC.md` for new AI capabilities.

