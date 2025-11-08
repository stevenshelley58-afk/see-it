Phase 2 Readiness
=================

Context Snapshot
----------------
- **Frontend**: Phase 1 ships the modal experience in `frontend/src/app/page.tsx` with mocked product metadata and toggleable mock APIs via `NEXT_PUBLIC_USE_MOCKS`.
- **Backend**: Phase 1 exposes `/sessions`, `/uploads/sign`, `/generate-preview`, and `/send-session-email` implemented in `backend/src/routes/*`, with Vertex AI + Postmark integrations guarded by environment variables.
- **Infrastructure**: GCP + Vercel deployment requirements are captured in `docs/infrastructure.md`; launch and QA checklists live in `docs/launch-checklist.md` and `docs/qa-checklist.md`.

Phase 2 Objectives
------------------
- **Shopify storefront integration**
  - Replace hard-coded product metadata with runtime data from the storefront iframe via App Bridge.
  - Implement JWT validation middleware for Shopify session tokens before issuing signed uploads or sessions.
  - Ship a Theme App Extension or script embed that mounts the modal with localized copy and passes `productId`, `variantId`, `locale`, and metafield data.
- **Merchant configuration surface**
  - Build an admin UI for verifying and publishing `see_it_image` and `see_it_prompt` metafields.
  - Add validation + preview tooling so merchants can QA prompts before publish (ties back to `docs/requirements.md` decisions).
- **Observability + analytics**
  - Wire client events in `frontend/src/lib/analytics.ts` to GA4/Segment destinations.
  - Export backend logs (Cloud Run & Firestore) to BigQuery + Looker Studio dashboards per `docs/analytics.md`.
  - Confirm retry/alert policies for Vertex AI latency, error spikes, and email delivery failures.
- **Operational hardening**
  - Finish CORS origin allow-list automation sourced from Shopify shop domains.
  - Implement bucket object TTL enforcement (verify lifecycle applied) and add scheduled purge for Firestore sessions >30 days.
  - Document on-call playbook + support flows referenced in `docs/launch-checklist.md`.
- **Performance polish**
  - Swap `<img>` tags for optimized `next/image` where feasible and configure remote domains.
  - Add loading skeletons for history thumbnails + placement canvas to improve perceived latency.
  - Instrument Web Vitals in Vercel for the modal route.

Required Access & Secrets
-------------------------
- **Shopify Admin**: API access token with `read_products`, `read_product_listings`, `write_customers`.
- **Google Cloud**: Service account with `roles/datastore.user`, `roles/storage.objectAdmin`, Vertex AI access in `us-central1`.
- **Email**: Postmark production server token + verified sender.
- **CDN**: Access to `cdn.seeit.app` or equivalent Cloud CDN fronting `GCS_BUCKET_NAME`.

Environment Checklist
---------------------
- Confirm `.env` files (frontend/backend) are populated and stored in 1Password or Secret Manager.
- Provision GCS bucket CORS + lifecycle rules using snippets in `docs/snippets/`.
- Set `SHOPIFY_API_VERSION` (default `2024-07`) and update `docs/infrastructure.md` if merchants require newer API.
- Ensure Vercel project has environment variables for backend URL, CDN base, and mock flag disabled in production.

Handover Artifacts for External Agent
-------------------------------------
- Link this document with `docs/shopify-integration.md` for implementation references.
- Provide recent build logs:
  - `frontend`: `npm run lint && npm run build`
  - `backend`: `npm run build`
- Share GCP + Shopify credential storage locations and rotation policy.
- Create Jira/Linear tickets for each objective above with acceptance criteria and QA owners.
- Schedule a walkthrough covering:
  - Modal UX flow and analytics hooks.
  - Backend API contract and error handling patterns.
  - Deployment pipeline expectations (Cloud Run + Vercel).

Out-of-Scope for Phase 2
------------------------
- 3D/AR rendering upgrades.
- Persistent user galleries beyond 30-day TTL.
- Multi-tenant admin UI beyond single-store configuration.


