Phase 1 Deployment Checklist
============================

Build Artifacts
---------------
- **Frontend** (`frontend/`)
  - `npm install`
  - `npm run lint`
  - `npm run build`
  - Output: `.next/` production build, lint warnings only for `<img>` usage (acceptable per design doc; track for Phase 2 optimization).
- **Backend** (`backend/`)
  - `npm install`
  - `npm run build`
  - Output: `dist/` directory with compiled Express service.

Configuration Inputs
--------------------
- Copy `frontend/env.sample` → `.env.local`; set `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_UPLOAD_CDN_BASE`.
- Copy `backend/env.sample` → `.env`; populate GCP, Vertex, Shopify, Postmark, and CORS secrets.
- Ensure secrets are stored in the team vault and mirrored to Vercel (frontend) + Cloud Run (backend).

Deployment Steps
----------------
1. **Backend (Cloud Run)**
   - Build container: `gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/see-it-backend`
   - Deploy:  
     `gcloud run deploy see-it-backend \\`  
     `  --image gcr.io/$GCP_PROJECT_ID/see-it-backend \\`  
     `  --region=us-central1 \\`  
     `  --platform=managed \\`  
     `  --min-instances=1 \\`  
     `  --set-secrets=...` (map env vars from Secret Manager)  
     `  --set-env-vars=ALLOWED_ORIGINS=https://store.example.com`
   - Verify: `curl -H "Authorization: Bearer <shopify_jwt>" https://backend.seeit.app/healthz`
2. **Frontend (Vercel)**
   - Link project: `vercel link`
   - Push environment: `vercel env pull .env.local`
   - Deploy preview: `vercel --prod`
   - Confirm environment variables:  
     `NEXT_PUBLIC_BACKEND_URL=https://backend.seeit.app`  
     `NEXT_PUBLIC_UPLOAD_CDN_BASE=https://cdn.seeit.app`  
     `NEXT_PUBLIC_USE_MOCKS=false`
3. **CDN + Storage**
   - Apply lifecycle: `gsutil lifecycle set docs/snippets/gcs-lifecycle.json gs://see-it-uploads`
   - Apply CORS: `gsutil cors set docs/snippets/gcs-cors.json gs://see-it-uploads`
   - Invalidate CDN (if needed): `gcloud compute url-maps invalidate-cdn-cache see-it-cdn --path "/*"`

Post-Deploy Validation
----------------------
- Run through UX flow on staging Shopify store (capture → placement → preview → email).
- Monitor Cloud Run logs for `/generate-preview` latency and error rates.
- Send test session email; confirm Postmark delivery and template rendering.
- Verify GA4/Segment ingestion of `seeit_*` events from `window.dataLayer`.
- Update `docs/launch-checklist.md` with completion status and notify stakeholders.

Rollback Plan
-------------
- Frontend: `vercel rollback <deployment-id>`
- Backend: `gcloud run services update-traffic see-it-backend --to-latest --platform=managed --region=us-central1`
- Re-enable mock mode in frontend `.env.local` if Vertex AI outage occurs.


