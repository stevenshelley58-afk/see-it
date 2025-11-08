See It Backend
==============

This Cloud Run service exposes the `/generate-preview` endpoint and shared helpers for Firestore, GCS, and Shopify integrations.

Setup
-----
1. Install dependencies: `npm install`.
2. Copy `env.sample` to `.env` and fill in the values.
3. Run locally with `npm run dev`.

Configuration
-------------
- `GCP_PROJECT_ID`: Google Cloud project containing Firestore and GCS.
- `GCS_BUCKET_NAME`: Bucket used for room photo uploads and generated previews.
- `SHOPIFY_*`: Credentials for the connected Shopify store.
- `SHOPIFY_ADMIN_ACCESS_TOKEN`: Admin API access token created for the app.
- `VERTEX_LOCATION`: Region for Vertex AI (e.g., `us-central1`).
- `VERTEX_MODEL`: Gemini model identifier.
- `POSTMARK_SERVER_TOKEN`: API token for transactional emails.
- `POSTMARK_FROM_EMAIL`: Verified “from” address.
- `POSTMARK_TEMPLATE_ID`: Template alias or ID containing preview list markup.
- `ALLOWED_ORIGINS`: Comma-separated list of storefront origins allowed to call the API.
- `LOG_LEVEL`: Defaults to `info`.

Deployment
----------
- Build with `npm run build`.
- Deploy using `gcloud run deploy`, passing environment variables and granting access to Firestore and GCS service accounts.

Next Steps
----------
- Implement Vertex AI calls inside `/generate-preview`.
- Add `/send-session-email` endpoint (Phase 4).

