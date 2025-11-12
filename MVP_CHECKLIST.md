# MVP Checklist - Get Running on Your Store

Quick checklist to get your app running on your own store for MVP iteration.

## Phase 1: Setup (Do This First) ✅

### Backend Setup
- [ ] Copy `backend/env.sample` to `backend/.env`
- [ ] Fill in GCP credentials:
  - [ ] `GCP_PROJECT_ID`
  - [ ] `GCS_BUCKET_NAME`
- [ ] Fill in Shopify credentials:
  - [ ] `SHOPIFY_API_KEY` (from Partner Dashboard)
  - [ ] `SHOPIFY_API_SECRET` (from Partner Dashboard)
  - [ ] `SHOPIFY_SHOP` (your store domain, e.g., `mystore.myshopify.com`)
- [ ] Fill in Vertex AI:
  - [ ] `VERTEX_LOCATION`
  - [ ] `VERTEX_MODEL`
- [ ] Fill in Postmark:
  - [ ] `POSTMARK_SERVER_TOKEN`
  - [ ] `POSTMARK_FROM_EMAIL`
  - [ ] `POSTMARK_TEMPLATE_ID`
- [ ] Set `ALLOWED_ORIGINS` to your storefront URL
- [ ] Run `npm install` in `backend/`
- [ ] Test backend: `npm run dev` (should start on port 8080)

### Frontend Setup
- [ ] Copy `frontend/env.sample` to `frontend/.env.local`
- [ ] Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080`
- [ ] Set `NEXT_PUBLIC_UPLOAD_CDN_BASE=http://localhost:8080`
- [ ] Set `NEXT_PUBLIC_SHOPIFY_API_KEY` (same as backend)
- [ ] Set `NEXT_PUBLIC_USE_MOCKS=false`
- [ ] Run `npm install` in `frontend/`
- [ ] Test frontend: `npm run dev` (should start on port 3000)

### GCP Setup
- [ ] Create GCP project
- [ ] Enable APIs (Firestore, Storage, Vertex AI, Cloud Run)
- [ ] Create Firestore database
- [ ] Create Cloud Storage bucket
- [ ] Set bucket lifecycle (30-day delete)
- [ ] Set bucket CORS
- [ ] Create service account
- [ ] Grant permissions to service account

### Shopify Setup
- [ ] Create app in Partner Dashboard
  - [ ] Get API Key
  - [ ] Get API Secret
  - [ ] Set App URL (use localhost for now: `http://localhost:3000/admin`)
- [ ] Create Custom App in your store
  - [ ] Shopify Admin → Settings → Apps → Develop apps
  - [ ] Create app
  - [ ] Enable scopes: `read_products`, `read_product_listings`, `write_customers`
  - [ ] Install app
  - [ ] Get Admin API token (starts with `shpat_`)
  - [ ] Add to backend `.env` as `SHOPIFY_ADMIN_ACCESS_TOKEN`

### Postmark Setup
- [ ] Create Postmark account
- [ ] Create server
- [ ] Get server token
- [ ] Verify sender signature
- [ ] Create email template

## Phase 2: Deploy (When Ready)

### Backend Deployment
- [ ] Build Docker image: `gcloud builds submit --tag gcr.io/PROJECT_ID/see-it-backend`
- [ ] Store secrets in Secret Manager
- [ ] Deploy to Cloud Run
- [ ] Test backend URL: `curl https://your-backend.run.app/healthz`
- [ ] Update frontend `.env.local` with backend URL

### Frontend Deployment
- [ ] Deploy to Vercel: `vercel`
- [ ] Set environment variables in Vercel dashboard
- [ ] Update Partner Dashboard App URL to Vercel URL
- [ ] Test admin interface: `https://your-app.vercel.app/admin`

## Phase 3: Storefront Integration

### Manual Integration (MVP)
- [ ] Add button to product template:
  ```liquid
  <button onclick="window.open('https://your-app.com?productId={{ product.id }}', 'SeeIt')">
    See It In Your Home
  </button>
  ```
- [ ] Test on product page
- [ ] Verify modal opens
- [ ] Test full flow (upload → crop → place → preview → email)

### Product Setup
- [ ] Add metafields to products:
  - [ ] `custom.see_it_prompt` (text, max 500 chars)
  - [ ] `custom.see_it_image` (file reference, PNG)
- [ ] Test with at least 3 products

## Phase 4: Test & Iterate

### Testing
- [ ] Test admin interface (`/admin`)
  - [ ] Can see products
  - [ ] Can edit metafields
  - [ ] Can save changes
- [ ] Test customer modal (`/`)
  - [ ] Opens from product page
  - [ ] Can upload photo
  - [ ] Can crop image
  - [ ] Can place product
  - [ ] Preview generates
  - [ ] Can send email
- [ ] Test on mobile
- [ ] Test on desktop

### Iteration
- [ ] Fix bugs found
- [ ] Improve UX based on testing
- [ ] Optimize performance
- [ ] Gather feedback

## Phase 5: When Ready for App Store

See `docs/MVP_TO_APP_STORE_ROADMAP.md` for full migration guide.

### Quick Prep
- [ ] Implement OAuth flow
- [ ] Add database for multi-store tokens
- [ ] Create theme app extension
- [ ] Write app listing copy
- [ ] Take screenshots
- [ ] Submit to App Store

---

## Common Issues & Fixes

### Backend won't start
- Check `.env` file exists and has all required vars
- Check GCP credentials are valid
- Check port 8080 is available

### Frontend won't connect to backend
- Check `NEXT_PUBLIC_BACKEND_URL` is correct
- Check backend is running
- Check CORS settings

### Shopify auth fails
- Check `SHOPIFY_API_KEY` matches Partner Dashboard
- Check `SHOPIFY_SHOP` is correct format
- Check app is installed on store

### Preview generation fails
- Check Vertex AI credentials
- Check quota/limits
- Check model name is correct

---

## Quick Commands

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# Deploy backend
gcloud builds submit --tag gcr.io/PROJECT_ID/see-it-backend
gcloud run deploy see-it-backend --image gcr.io/PROJECT_ID/see-it-backend

# Deploy frontend
cd frontend
vercel
```

---

**Focus**: Get MVP working on your store first, then iterate. Don't worry about App Store until MVP is stable!
