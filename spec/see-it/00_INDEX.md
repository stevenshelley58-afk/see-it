# See It Specification Index

See It is a Shopify app that lets shoppers preview products inside their own rooms by combining a storefront widget, a merchant-facing admin experience, and an internal image service backed by Gemini 3 Pro Image. This spec is the single source of truth for contracts, data, and build guidance.

## Table of Contents

- [Overview](./01_PRODUCT_OVERVIEW.md) — Product goals, user stories, and constraints for v1.
- [Architecture](./02_ARCHITECTURE.md) — System components, storage layout, and request flows.
- [Schema](./03_SCHEMA_AND_METADATA.md) — Database tables, enums, and Shopify metafields.
- [API contracts](./04_API_CONTRACTS.md) — Stable JSON contracts for app proxy and image service endpoints.
- [Frontend admin](./05_FRONTEND_SHOPIFY_ADMIN.md) — Merchant flows, data dependencies, and UI state rules.
- [Theme extension](./06_FRONTEND_THEME_EXTENSION.md) — Shopper journey, widget behaviours, and interaction rules.
- [Image service](./07_IMAGE_SERVICE_SPEC.md) — Service responsibilities, prompt/model usage, and logging.
- [Prompts](./08_PROMPTS_SPEC.md) — Prompt inventory, versions, and style presets.
- [Implementation plan](./09_IMPLEMENTATION_PLAN.md) — Phase roadmap, scope boundaries, and doc links.
- [Agent guidelines](./10_AGENT_GUIDELINES.md) — Working rules for Codex and doc reading paths.

