# Agent Guidelines

## Sources of Truth

- API payloads: `04_API_CONTRACTS.md`
- Schema: `03_SCHEMA_AND_METADATA.md`
- Prompts: `08_PROMPTS_SPEC.md`

## Hard Rules

- Never change payloads in `04_API_CONTRACTS.md` without human approval.
- Never change table or column names in `03_SCHEMA_AND_METADATA.md`.
- Treat status enums as closed sets until updated.

## MVP Expectations

- `/room/cleanup` returns original URL.
- `config.style_preset` defaults to `neutral`.
- `config.quality` defaults to `standard`.

## Logging Requirements

- Always record `model_id`.
- Always record `prompt_id`.
- Always record `prompt_version`.
- Write logs to `render_jobs`.

## Reading Paths for Codex

- Shopify admin app: read `00_INDEX.md`, `01_PRODUCT_OVERVIEW.md`, `02_ARCHITECTURE.md`, then `03_SCHEMA_AND_METADATA.md`, `04_API_CONTRACTS.md`, `05_FRONTEND_SHOPIFY_ADMIN.md`.
- Theme extension: read `00_INDEX.md`, `01_PRODUCT_OVERVIEW.md`, `02_ARCHITECTURE.md`, then `04_API_CONTRACTS.md`, `06_FRONTEND_THEME_EXTENSION.md`.
- Image service: read `00_INDEX.md`, `02_ARCHITECTURE.md`, `03_SCHEMA_AND_METADATA.md`, `04_API_CONTRACTS.md`, `07_IMAGE_SERVICE_SPEC.md`, `08_PROMPTS_SPEC.md`.

