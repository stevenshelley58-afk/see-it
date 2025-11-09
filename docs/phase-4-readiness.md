Phase 4 Readiness Brief
=======================

Context Snapshot
----------------
- Phase 3 shipped the merchant admin console, analytics bridge (GA4 + Segment), operational scripts (Firestore purge + bucket policies), and automated CI/CD pipelines.
- Multi-store authentication is supported via `SHOPIFY_ALLOWED_SHOPS`, but preview QA, dashboards, and advanced alerting remain open items.
- Both frontend and backend compile cleanly (`npm run build` in `/frontend` and `/backend`), and deployment is orchestrated through `.github/workflows/deploy.yml`.

Objectives
----------
1. **Preview Sandbox Experience**
   - Embed a low-cost preview runner inside the admin console so merchants can validate prompts without leaving Shopify.
   - Reuse `/generate-preview` where possible; add guardrails to prevent quota abuse (e.g., daily per-merchant limits, sample room templates).
2. **Analytics & Reporting**
   - Materialize GA4 events into Looker Studio dashboards (conversion funnel, retry rates, email opt-ins).
   - Ship a Segment destination function or warehouse sync to marry storefront traffic data with Firestore session states.
3. **Alerting & SLOs**
   - Configure Cloud Monitoring policies for Vertex AI latency/error spikes, Postmark delivery failures, and Cloud Run 5xx bursts.
   - Document on-call runbooks and escalation paths in `docs/launch-checklist.md`.
4. **CDN + Asset Hygiene**
   - Automate Cloud CDN invalidations when metafield hero images update (Cloud Build trigger or Pub/Sub from admin save).
   - Expand bucket verification tooling to assert lifecycle + CORS on a schedule (Cloud Scheduler invoking `npm run buckets:apply`).
5. **Merchant UX Polish**
   - Add activity timeline inside the admin console (preview history, publish logs).
   - Support bulk metafield updates (CSV import/export or multi-select save) without breaking existing single-product flows.

Technical Inputs
----------------
- Admin API GraphQL utilities live in `backend/src/services/shopify.ts`; extend `listAdminProducts` / `updateProductMetafields` for bulk mutations.
- Admin UI is in `frontend/src/app/admin/page.tsx`; follow the existing pattern for state management (`ProductCard`) when adding preview sandboxing or history panes.
- Vertex helpers: `backend/src/services/vertex.ts` for generation, `backend/src/routes/generatePreview.ts` for orchestration. Consider adding a `sandbox` flag or alternative storage bucket for test blends.
- Operational scripts:
  - `npm run purge:sessions` → Firestore cleanup (`backend/src/scripts/purgeSessions.ts`).
  - `npm run buckets:apply` → bucket policy enforcement (`backend/src/scripts/applyBucketPolicies.ts`).
- CI/CD entry points:
  - Lint/build → `.github/workflows/ci.yml`
  - Deploy → `.github/workflows/deploy.yml` (requires repo secrets `GCP_PROJECT_ID`, `GCP_SERVICE_ACCOUNT_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, optional `CLOUD_RUN_DEPLOY_FLAGS`).

Implementation Updates (Nov 2025)
---------------------------------
- Preview sandbox is now live in the admin console. New endpoints `/admin/preview-sandbox/templates` and `/admin/preview-sandbox/run` reuse `generatePreviewImage` while enforcing per-merchant quotas (default `SANDBOX_DAILY_LIMIT=15`). Optional `SANDBOX_ROOM_TEMPLATES` allows overriding the built-in fixtures.
- Firestore tracks sandbox usage (`sandboxUsage` collection) and merchant activity (`activity` collection). The admin UI surfaces a timeline card powered by `/admin/activity`, capturing preview generations, sandbox runs, failures, and email sends.
- Frontend `ProductCard` embeds sandbox controls (template picker, quota indicator, preview gallery) and refreshes the activity feed after each run to streamline QA workflows.
- `backend/env.sample` documents the new environment variables; Cloud Scheduler should call `npm run buckets:apply` weekly to reassert bucket policies alongside the existing session purge.
- Deployment checklists should verify Cloud Monitoring alerts cover Vertex latency/error spikes and Postmark failure rates now that activity emits richer telemetry.

Environment & Secrets
---------------------
- Reuse the secrets catalogued in `docs/infrastructure.md`. No new scopes are required, but ensure GA4 and Segment credentials are stored in Vercel + Shopify admin `.env` files.
- Populate Cloud Scheduler / Pub/Sub credentials if automation jobs are promoted during Phase 4.

Kickoff Checklist
-----------------
1. Review `docs/phase-3-readiness.md` to confirm Phase 3 deliverables and open items.
2. Align on preview sandbox requirements (sample imagery, quota policies, guardrails).
3. Define analytics acceptance criteria with GTM/marketing stakeholders; stub Looker Studio data sources.
4. Create epics/tasks for each objective above with dependencies on existing modules highlighted.
5. Schedule a technical walkthrough focusing on:
   - Admin console extension points (`ProductCard`, GraphQL backend).
   - Vertex AI quota management + sandbox architecture.
   - Deployment pipeline secrets and rollback strategy.


