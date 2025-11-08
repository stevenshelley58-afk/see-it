Phase 3 Readiness Brief
=======================

Context Snapshot
----------------
- **Phase 2 delivery** (now in `main`): Shopify App Bridge integration, session token enforcement, product metafield hydration via `/products/config`, dynamic modal UX with loading skeletons, and Web Vitals instrumentation.
- **Frontend builds**: `npm run lint` & `npm run build` (Nov 8 2025) – see Vercel deployment artifacts referenced in `docs/phase-1-deployment.md`.
- **Backend build**: `npm run build` (tsc) confirming Express server compiles with new auth middleware.

What Remains Open
-----------------
- **Merchant admin tooling**: Build the UI/workflows to review, edit, and publish `see_it_prompt` / `see_it_image` metafields. Requires write access to Admin API and preview sandboxing per `docs/requirements.md`.
- **Observability follow-through**:
  - Push `window.dataLayer` events into GA4/Segment (current implementation populates the data layer only).
  - Configure Cloud Logging sinks + alerting described in `docs/analytics.md`.
- **Operational polish**:
  - Automate Firestore session purge (>30 days) via scheduled job or TTL.
  - Confirm GCS lifecycle rules + CDN invalidation automation (scripts live in `docs/snippets/`).
  - Expand CORS origin allow-list sync for multi-store installs if Phase 3 expands scope.
- **Deployment pipelines**: Stand up CI workflows for lint/build/test + Cloud Run/Vercel promotion (currently manual).

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


