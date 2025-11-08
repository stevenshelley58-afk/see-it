Infrastructure Blueprint
=========================

Google Cloud
------------
- **Project**: Shared with Firestore + Cloud Storage (variable `GCP_PROJECT_ID`).
- **Firestore**: Native mode, collection `sessions` with TTL policies for `createdAt` (30 days).
- **Cloud Storage**: Bucket `see-it-uploads` with public access via Cloud CDN fronting `cdn.seeit.app`.
  - Lifecycle rule: delete objects after 30 days.
  - CORS: allow `POST`/`GET` from storefront domains.
- **Cloud CDN**: Enabled on bucket backend, caching generated previews with cache-busting query.
- **Cloud Run**: Deploy `see-it-backend` service with minimum 1 instance, CPU always allocated.
  - Env vars from `backend/env.sample`.
  - Service account with roles `roles/datastore.user`, `roles/storage.objectAdmin`.
- **Secrets Manager**: Store Shopify credentials and inject into Cloud Run.

Vercel / Frontend
-----------------
- Next.js app deployed via Vercel.
- Environment variables:
  - `NEXT_PUBLIC_BACKEND_URL=https://backend.seeit.app`
  - `NEXT_PUBLIC_UPLOAD_CDN_BASE=https://cdn.seeit.app`
- Edge config for allowed origins and security headers.

CI/CD
-----
- GitHub Actions workflows:
  - Lint + Type check for `frontend` and `backend`.
  - Deploy backend with `gcloud` CLI on tagged releases.
  - Deploy frontend via Vercel preview/production promotions.

Observability
-------------
- Cloud Logging sinks to BigQuery for `/generate-preview` metrics.
- Error alerts via Cloud Monitoring policies (5xx spikes, latency).

Provisioning Checklist
----------------------
1. `gcloud services enable firestore.googleapis.com run.googleapis.com aiplatform.googleapis.com storage.googleapis.com compute.googleapis.com`
2. `gcloud firestore databases create --project=$GCP_PROJECT_ID --region=nam5 --type=firestore-native`
3. `gsutil mb -l us-central1 gs://see-it-uploads` and apply lifecycle + CORS configs from `/docs/snippets/gcs-lifecycle.json` and `/docs/snippets/gcs-cors.json`.
4. `gcloud storage buckets add-iam-policy-binding gs://see-it-uploads --member=serviceAccount:see-it-backend@$GCP_PROJECT_ID.iam.gserviceaccount.com --role=roles/storage.objectAdmin`
5. `gcloud run deploy see-it-backend --image gcr.io/$GCP_PROJECT_ID/see-it-backend --min-instances=1 --region=us-central1 --set-secrets=...`
6. `shopify app env set` with metafields and host configuration; verify `/sessions` endpoint using `curl` with store JWT.

