Phase 3 Readiness Brief
=======================

Context Snapshot
----------------
- **Phase 2 delivery** (now in `main`): Shopify App Bridge integration, session token enforcement, product metafield hydration via `/products/config`, dynamic modal UX with loading skeletons, and Web Vitals instrumentation.
- **Frontend builds**: `npm run lint` & `npm run build` (Nov 8 2025) – see Vercel deployment artifacts referenced in `docs/phase-1-deployment.md`.
- **Backend build**: `npm run build` (tsc) confirming Express server compiles with new auth middleware.

Phase 3 Deliverables
--------------------
- **Merchant admin console** – `frontend/src/app/admin/page.tsx` paired with `backend/src/routes/adminProducts.ts` surfaces prompts/images, supports multi-store JWT validation, and writes metafields through Shopify GraphQL.
- **Analytics wiring** – GA4 + Segment destinations load automatically when `NEXT_PUBLIC_GA4_MEASUREMENT_ID` / `NEXT_PUBLIC_SEGMENT_WRITE_KEY` are set; `frontend/src/components/AnalyticsBridge.tsx` forwards every `seeit_*` event.
- **Operational automation** – `npm run purge:sessions` (Firestore cleanup), `npm run buckets:apply` (CORS + lifecycle), and enhanced CORS allow-list via `SHOPIFY_ALLOWED_SHOPS` and `STOREFRONT_ORIGINS`.
- **CI/CD pipelines** – `.github/workflows/ci.yml` for lint/build gates and `.github/workflows/deploy.yml` for Cloud Run + Vercel promotion (requires repo secrets documented in `docs/infrastructure.md`).

What Remains Open
-----------------
- **Preview sandboxing**: Provide a fixture-based preview runner inside the admin console so merchants can trigger a low-cost sample blend before publishing prompts.
- **Analytics dashboards**: Stand up GA4 funnel and Looker Studio reports consuming the new event streams (schema captured in `docs/analytics.md`).
- **Cloud Monitoring**: Finalize alerting policies for Vertex AI latency spikes and Postmark delivery failures (config templates still outstanding).
- **CDN invalidation**: Scripted integration for Cloud CDN cache busting after hero image updates (current workflow documents the manual `gcloud compute url-maps invalidate-cdn-cache` call).

Inputs for External Agent
-------------------------
- **Source of truth**: GitHub repository `see-it` (main branch). Current commit includes Phase 2 work.
- **Secrets**:
  - Shopify `SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET` stored in 1Password vault `See It / Infra`.
  - Google Cloud project + Service Account (`see-it-backend@...`) – documented in `docs/infrastructure.md`.
  - Postmark sender + template references in `backend/env.sample`.
- **Runtime pointers**:
  - Backend: Cloud Run service `see-it-backend` (us-central1) fronted by API Gateway.
  - Frontend: Vercel project `see-it-modal`.
  - CDN: `cdn.seeit.app` targeting `gs://see-it-uploads`.

Recommended Kickoff Checklist
-----------------------------
1. Clone repo & run `npm install` in `/frontend` and `/backend`.
2. Verify lint/build locally (`npm run lint && npm run build` frontend, `npm run build` backend).
3. Review analytics + admin UI requirements in `docs/phase-2-readiness.md` and `docs/requirements.md`.
4. Draft implementation tickets:
   - Admin workflow (UI + backend write endpoints).
   - Analytics export (GA4/Segment wiring + dashboards).
   - Ops automation (Firestore purge job, lifecycle verification).
5. Schedule walkthrough with current team (covers modal UX, backend contract, deployment expectations).

Key Assets & References
-----------------------
- `frontend/src/lib/shopifyBridge.ts`: App Bridge bootstrap + session token helper.
- `frontend/src/app/page.tsx`: Modal UX, loading skeletons, analytics emission.
- `backend/src/middleware/shopifyAuth.ts`: JWT validation against Shopify JWKS.
- `backend/src/routes/productConfig.ts`: Product metafield hydration endpoint.
- `docs/shopify-integration.md`: Updated integration notes (App Bridge, auth flow).
- `docs/phase-1-deployment.md`: Environment + deployment commands.


