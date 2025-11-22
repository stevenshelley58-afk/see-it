# Product Overview

## Purpose

This is the build spec for the first version of the Shopify app “See It”. It enables Codex to implement the product without future refactors: the MVP runs on final architecture, and all contracts, tables, and endpoints documented here are treated as stable.

## High Level

### Goal

- As a shopper on a product detail page, I can open “See It in your room”, upload a room photo, optionally edit it in future phases, position a ghost overlay of the product, trigger a render, and review a realistic composite image.
- As a merchant, I can pre-process product imagery into transparent PNGs, configure See It settings, monitor usage, and rely on an internal image service that wraps Gemini 3 Pro Image.

### Constraints

- Shopify-first implementation using the Shopify App Template with React Router.
- Admin UI built with Polaris web components.
- PDP experience delivered via a theme app extension.
- Storefront ↔ app communication handled through app proxy endpoints with HMAC validation.
- Admin data accessed via Shopify GraphQL; avoid new REST endpoints unless required.
- Dedicated image service exposed over HTTP; all binaries stored in object storage (GCS/S3/R2) referenced by URLs, never persisted in the database.
- Prompt text versioned independently of code via `PROMPT_*` identifiers.
- MVP ships on the final architecture—no temporary shortcuts.

## Merchant User Stories

- As a merchant, I complete OAuth install, have my shop record created, webhooks registered, and can walk through a setup wizard that helps scope See It to products and add the theme block.
- As a merchant, I can view a product’s Shopify images, trigger preparation for See It, see the status of generated assets, regenerate when needed, and choose the default asset tied to metafields.
- As a merchant, I configure See It defaults (style preset, automation flags) and review usage and plan quota information inside the admin.

## Shopper User Stories

- As a shopper, I click “See it in your room” on the PDP and open a modal overlay without leaving the page.
- As a shopper, I upload or capture a room photo, have it acknowledged by the system, and (in later phases) optionally clean up existing furniture.
- As a shopper, I position the product’s ghost overlay on my room image, submit the configuration, and receive a composite render that looks realistic.
- As a shopper, I can iterate by adjusting placement, trying different rooms, or closing the experience once satisfied.

## Non Goals

- Room cleanup tooling (mask-based erase and re-inpainting) ships after the MVP.
- Placement enhancements such as resize, rotation, and advanced drag semantics are deferred.
- Batch preparation, stale-asset automation, billing integration, quota enforcement per plan, and analytic extras are later phases.
- Server-side shortcuts or reduced architecture (e.g., bypassing the image service or object storage) are not permitted even for MVP.

