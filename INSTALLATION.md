# Installation Guide: See It Shopify App

This guide will walk you through installing and running the See It app on your Shopify store.

## Quick Start (TL;DR)

1. **Create Shopify App** → Get API Key & Secret
2. **Set up GCP** → Create project, Firestore, Storage bucket
3. **Set up Postmark** → Get server token
4. **Configure env files** → Copy `env.sample` to `.env` / `.env.local`
5. **Install dependencies** → `npm install` in both `backend/` and `frontend/`
6. **Run locally** → `npm run dev` in both directories
7. **Deploy backend** → Cloud Run
8. **Deploy frontend** → Vercel
9. **Get Admin Token** → Create custom app in Shopify admin
10. **Configure products** → Add metafields

For detailed instructions, continue reading below.

## Prerequisites

Before you begin, ensure you have:

1. **Shopify Partner Account** - Create one at [partners.shopify.com](https://partners.shopify.com)
2. **Google Cloud Platform Account** - For Firestore, Cloud Storage, and Vertex AI
3. **Vercel Account** - For frontend hosting (or deploy elsewhere)
4. **Postmark Account** - For transactional emails
5. **Node.js 20+** - For local development
6. **Git** - To clone and manage the repository

## Step 1: Create a Shopify App

1. Go to your [Shopify Partner Dashboard](https://partners.shopify.com)
2. Click **Apps** → **Create app**
3. Choose **Create app manually**
4. Name your app (e.g., "See It")
5. Set the **App URL** to your frontend URL (you'll update this after deployment)
6. Set the **Allowed redirection URL(s)** to:
   - `https://your-frontend-domain.com/api/auth/callback`
   - `https://your-frontend-domain.com/api/auth/shopify/callback`

### Configure App Scopes

In your Shopify app settings, request these scopes:
- `read_products`
- `read_product_listings`
- `write_customers` (for email consent)
- `read_assigned_fulfillment_orders` (optional, for future features)

### Get Your Credentials

After creating the app, you'll receive:
- **API Key** (Client ID)
- **API Secret** (Client Secret)

Save these for later configuration.

## Step 2: Set Up Google Cloud Platform

### Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your **Project ID**

### Enable Required APIs

Enable these APIs in your GCP project:
- Cloud Firestore API
- Cloud Storage API
- Vertex AI API

```bash
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

### Create Firestore Database

1. Go to **Firestore** in the GCP Console
2. Click **Create database**
3. Choose **Native mode**
4. Select a location (e.g., `us-central`)
5. Create the database

### Create Cloud Storage Bucket

```bash
# Replace with your bucket name
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l us-central1 gs://see-it-uploads

# Set lifecycle policy (optional - auto-delete after 30 days)
gsutil lifecycle set docs/snippets/gcs-lifecycle.json gs://see-it-uploads

# Set CORS policy
gsutil cors set docs/snippets/gcs-cors.json gs://see-it-uploads
```

### Set Up Vertex AI

1. Go to **Vertex AI** in the GCP Console
2. Ensure the API is enabled
3. Note your preferred region (e.g., `us-central1`)
4. The app uses Gemini 2.5 Flash Image model by default

### Create Service Account

Create a service account for the backend:

```bash
gcloud iam service-accounts create see-it-backend \
  --display-name="See It Backend Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:see-it-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:see-it-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:see-it-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

## Step 3: Set Up Postmark

1. Sign up at [Postmark](https://postmarkapp.com)
2. Create a **Server**
3. Get your **Server API Token**
4. Verify your **Sender Signature** (email domain)
5. Create an email template (or use the default)
6. Note your **Template ID**

## Step 4: Configure Environment Variables

### Backend Configuration

1. Copy the sample environment file:
   ```bash
   cd backend
   cp env.sample .env
   ```

2. Edit `.env` with your values:
   ```env
   GCP_PROJECT_ID=your-gcp-project-id
   GCS_BUCKET_NAME=see-it-uploads
   SHOPIFY_API_KEY=your-shopify-api-key
   SHOPIFY_API_SECRET=your-shopify-api-secret
   SHOPIFY_SHOP=your-store.myshopify.com
   SHOPIFY_ALLOWED_SHOPS=your-store.myshopify.com
   SHOPIFY_HOST=your-app-domain.com
   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx  # Get this after installing the app
   SHOPIFY_SCOPES=read_products,read_product_listings
   VERTEX_LOCATION=us-central1
   VERTEX_MODEL=publishers/google/models/gemini-2.5-flash-image
   SANDBOX_DAILY_LIMIT=15
   POSTMARK_SERVER_TOKEN=your-postmark-token
   POSTMARK_FROM_EMAIL=see-it@yourdomain.com
   POSTMARK_TEMPLATE_ID=see-it-session
   ALLOWED_ORIGINS=https://yourstorefront.com,https://preview.yourstorefront.com
   STOREFRONT_ORIGINS=https://yourstorefront.com
   LOG_LEVEL=info
   SESSION_RETENTION_DAYS=30
   PORT=8080
   ```

### Frontend Configuration

1. Copy the sample environment file:
   ```bash
   cd frontend
   cp env.sample .env.local
   ```

2. Edit `.env.local` with your values:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8080  # For local dev, update after deployment
   NEXT_PUBLIC_UPLOAD_CDN_BASE=http://localhost:8080  # For local dev, update after deployment
   NEXT_PUBLIC_USE_MOCKS=false  # Set to true for local testing without backend
   NEXT_PUBLIC_SHOPIFY_API_KEY=your-shopify-api-key
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX  # Optional: Google Analytics
   NEXT_PUBLIC_SEGMENT_WRITE_KEY=segment-write-key  # Optional: Segment analytics
   ```

## Step 5: Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Step 6: Run Locally (Development)

### Start Backend

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:8080`

### Start Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

### Test Locally

1. Update `frontend/.env.local`:
   - Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080`
   - Set `NEXT_PUBLIC_USE_MOCKS=true` for initial testing

2. Visit `http://localhost:3000` to see the app

## Step 7: Deploy Backend (Cloud Run)

### Build Docker Image

```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/see-it-backend
```

### Deploy to Cloud Run

```bash
gcloud run deploy see-it-backend \
  --image gcr.io/YOUR_PROJECT_ID/see-it-backend \
  --region=us-central1 \
  --platform=managed \
  --min-instances=1 \
  --max-instances=20 \
  --allow-unauthenticated \
  --service-account=see-it-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars="GCP_PROJECT_ID=YOUR_PROJECT_ID,GCS_BUCKET_NAME=see-it-uploads,VERTEX_LOCATION=us-central1" \
  --set-secrets="SHOPIFY_API_KEY=shopify-api-key:latest,SHOPIFY_API_SECRET=shopify-api-secret:latest,SHOPIFY_ADMIN_ACCESS_TOKEN=shopify-admin-token:latest,POSTMARK_SERVER_TOKEN=postmark-token:latest"
```

**Note:** Store sensitive values in Secret Manager and reference them with `--set-secrets`.

After deployment, note your Cloud Run URL (e.g., `https://see-it-backend-xxx.run.app`)

## Step 8: Deploy Frontend (Vercel)

### Install Vercel CLI

```bash
npm i -g vercel
```

### Deploy

```bash
cd frontend
vercel
```

Follow the prompts:
1. Link to existing project or create new
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_BACKEND_URL=https://your-cloud-run-url.run.app`
   - `NEXT_PUBLIC_UPLOAD_CDN_BASE=https://your-cloud-run-url.run.app`
   - `NEXT_PUBLIC_SHOPIFY_API_KEY=your-api-key`
   - `NEXT_PUBLIC_USE_MOCKS=false`

After deployment, note your Vercel URL (e.g., `https://see-it.vercel.app`)

## Step 9: Complete Shopify App Setup

### Update App URLs

1. Go back to your Shopify Partner Dashboard
2. Edit your app
3. Update:
   - **App URL**: `https://your-vercel-domain.com`
   - **Allowed redirection URL(s)**: `https://your-vercel-domain.com/api/auth/callback`

### Install App on Your Store

There are two ways to get the Admin API Access Token:

#### Option A: Custom App (Recommended for Development)

1. In your Shopify admin, go to **Settings** → **Apps and sales channels**
2. Click **Develop apps** → **Create an app**
3. Name your app (e.g., "See It Backend")
4. Click **Configure Admin API scopes** and enable:
   - `read_products`
   - `read_product_listings`
   - `write_customers`
   - `read_assigned_fulfillment_orders` (optional)
5. Click **Save**
6. Click **Install app**
7. After installation, click **API credentials** → **Reveal token once**
8. Copy the token (starts with `shpat_`)
9. Update your backend `.env` with `SHOPIFY_ADMIN_ACCESS_TOKEN`

#### Option B: OAuth Flow (For Production)

If you're building a public app, implement OAuth flow to get access tokens dynamically. For now, use Option A for development/testing.

### Redeploy Backend

After getting the admin token, update and redeploy:

```bash
# Store token in Secret Manager (if not already created)
echo -n "shpat_xxx" | gcloud secrets create shopify-admin-token --data-file=-

# Or update existing secret
echo -n "shpat_xxx" | gcloud secrets versions add shopify-admin-token --data-file=-

# Redeploy Cloud Run with updated secret
gcloud run deploy see-it-backend \
  --set-secrets="SHOPIFY_ADMIN_ACCESS_TOKEN=shopify-admin-token:latest"
```

## Step 10: Configure Product Metafields

For each product you want to use with See It:

1. Go to **Settings** → **Custom data** → **Products**
2. Add metafield definitions:
   - **Namespace**: `custom`
   - **Key**: `see_it_image` (File reference, PNG with transparency)
   - **Key**: `see_it_prompt` (Single-line text, max 500 chars)

3. For each product:
   - Add the product image (PNG with transparency)
   - Add a prompt describing the product placement

## Step 11: Add CTA to Storefront

### For Online Store 2.0 Themes

1. Go to **Online Store** → **Themes** → **Customize**
2. Navigate to a product page
3. Add a **Custom HTML** or **App embed** block
4. Add the See It button code (you'll need to create a theme app extension)

### For Headless Storefronts

Embed the app using Shopify App Bridge in your storefront code.

## Step 12: Test the Installation

1. Visit a product page on your store
2. Click the "See It In Your Home" button
3. Test the flow:
   - Upload/capture a room photo
   - Crop the image
   - Place the product
   - Generate preview
   - Send email

## Troubleshooting

### Backend Issues

- Check Cloud Run logs: `gcloud run services logs read see-it-backend`
- Verify environment variables are set correctly
- Ensure service account has proper permissions

### Frontend Issues

- Check Vercel deployment logs
- Verify `NEXT_PUBLIC_BACKEND_URL` points to your Cloud Run service
- Check browser console for errors

### Authentication Issues

- Verify Shopify API credentials are correct
- Ensure app URLs match in Shopify Partner Dashboard
- Check that session tokens are being generated correctly

### Storage Issues

- Verify GCS bucket exists and is accessible
- Check bucket CORS configuration
- Ensure service account has storage permissions

## Next Steps

- Review the [Launch Checklist](docs/launch-checklist.md)
- Set up monitoring and alerts
- Configure analytics (GA4/Segment)
- Test with real products
- Gradually roll out to customers

## Support

For issues or questions:
- Check the [Shopify Integration docs](docs/shopify-integration.md)
- Review [Phase 1 Deployment](docs/phase-1-deployment.md)
- Check backend logs and frontend console for errors
