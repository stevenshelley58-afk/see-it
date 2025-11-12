# Installation Guide: See It Shopify App

This guide will walk you through installing and running the See It app on your Shopify store.

## Overview

This is a **Shopify App Bridge** app with two interfaces:
- **Admin Interface** (`/admin`) - Accessed from Shopify admin for managing product metafields
- **Customer Modal** (`/`) - Embedded in your storefront product pages

The app uses Shopify App Bridge for authentication - no OAuth flow needed. Shopify handles authentication automatically when the app is installed.

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
5. Set the **App URL** to your frontend URL (you'll update this after deployment):
   - For now: `https://your-app.vercel.app` (or your domain)
   - This is where Shopify will load your app in the admin
6. Set the **Allowed redirection URL(s)** to:
   - `https://your-app.vercel.app/admin`
   - `https://your-app.vercel.app`

### Configure App Scopes

In your Shopify app settings, request these scopes:
- `read_products`
- `read_product_listings`
- `write_customers` (for email consent)
- `read_assigned_fulfillment_orders` (optional, for future features)

### Get Your Credentials

After creating the app, you'll receive:
- **API Key** (Client ID) - This is your `SHOPIFY_API_KEY` / `NEXT_PUBLIC_SHOPIFY_API_KEY`
- **API Secret** (Client Secret) - This is your `SHOPIFY_API_SECRET`

**Important:** You do NOT need to implement OAuth. Shopify App Bridge handles authentication automatically when merchants install your app.

## Step 2: Set Up Google Cloud Platform

### Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your **Project ID**

### Enable Required APIs

```bash
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable compute.googleapis.com
```

### Create Firestore Database

1. Go to **Firestore** in the GCP Console
2. Click **Create database**
3. Choose **Native mode**
4. Select a location (e.g., `nam5` for us-central)
5. Create the database

### Create Cloud Storage Bucket

```bash
# Replace YOUR_PROJECT_ID with your actual project ID
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l us-central1 gs://see-it-uploads

# Set lifecycle policy (auto-delete after 30 days)
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

```bash
# Create service account
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
   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx  # See Step 9
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

1. For testing the admin interface, you'll need to access it through Shopify admin (see Step 10)
2. For testing the customer modal, you can set `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local` to test without backend

## Step 7: Deploy Backend (Cloud Run)

### Build Docker Image

```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/see-it-backend
```

### Store Secrets in Secret Manager

```bash
# Store Shopify credentials
echo -n "your-api-key" | gcloud secrets create shopify-api-key --data-file=-
echo -n "your-api-secret" | gcloud secrets create shopify-api-secret --data-file=-
echo -n "shpat_xxx" | gcloud secrets create shopify-admin-token --data-file=-

# Store Postmark token
echo -n "your-postmark-token" | gcloud secrets create postmark-token --data-file=-
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
  --set-env-vars="GCP_PROJECT_ID=YOUR_PROJECT_ID,GCS_BUCKET_NAME=see-it-uploads,VERTEX_LOCATION=us-central1,SHOPIFY_SHOP=your-store.myshopify.com,SHOPIFY_ALLOWED_SHOPS=your-store.myshopify.com,ALLOWED_ORIGINS=https://yourstorefront.com" \
  --set-secrets="SHOPIFY_API_KEY=shopify-api-key:latest,SHOPIFY_API_SECRET=shopify-api-secret:latest,SHOPIFY_ADMIN_ACCESS_TOKEN=shopify-admin-token:latest,POSTMARK_SERVER_TOKEN=postmark-token:latest"
```

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

## Step 9: Get Shopify Admin Access Token

The backend needs an Admin API access token to read product data and metafields. You have two options:

### Option A: Custom App (Recommended for Development)

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
9. Update your backend `.env` and Secret Manager with `SHOPIFY_ADMIN_ACCESS_TOKEN`

### Option B: Use Your App's Access Token (For Production)

When a merchant installs your app, Shopify provides an access token via OAuth. For now, use Option A. In production, you'll need to implement OAuth to get tokens dynamically per store.

### Update Backend Secret

```bash
# Update Secret Manager
echo -n "shpat_xxx" | gcloud secrets versions add shopify-admin-token --data-file=-

# Redeploy Cloud Run
gcloud run deploy see-it-backend \
  --set-secrets="SHOPIFY_ADMIN_ACCESS_TOKEN=shopify-admin-token:latest"
```

## Step 10: Complete Shopify App Setup

### Update App URLs in Partner Dashboard

1. Go back to your [Shopify Partner Dashboard](https://partners.shopify.com)
2. Edit your app
3. Update:
   - **App URL**: `https://your-vercel-domain.com/admin`
   - **Allowed redirection URL(s)**: 
     - `https://your-vercel-domain.com/admin`
     - `https://your-vercel-domain.com`

### Install App on Your Store

1. In your Shopify admin, go to **Apps** → **App and sales channel settings**
2. Find your app in the list
3. Click **Install** (or it may already be installed if you created it from the store)
4. Authorize the requested scopes

**Important:** When merchants install your app, Shopify automatically:
- Provides session tokens via App Bridge
- Handles authentication
- No OAuth implementation needed on your end

## Step 11: Access Admin Interface

The admin interface is accessible at `/admin` when launched from Shopify admin:

1. In your Shopify admin, go to **Apps**
2. Click on your "See It" app
3. Shopify will load `https://your-app-domain.com/admin?host=...`
4. The app uses App Bridge to get session tokens automatically

The admin interface lets you:
- View all products
- Configure `custom.see_it_prompt` and `custom.see_it_image` metafields
- Test preview generation with sandbox templates
- View activity timeline

## Step 12: Configure Product Metafields

For each product you want to use with See It:

### Option A: Via Admin Interface

1. Access the admin interface (Step 11)
2. Find your product in the list
3. Enter a prompt (describes how product should appear)
4. Select or enter a hero image URL
5. Click **Publish**

### Option B: Via Shopify Admin

1. Go to **Settings** → **Custom data** → **Products**
2. Add metafield definitions:
   - **Namespace**: `custom`
   - **Key**: `see_it_image` (File reference, PNG with transparency)
   - **Key**: `see_it_prompt` (Single-line text, max 500 chars)

3. For each product:
   - Go to the product page
   - Scroll to **Metafields** section
   - Add the product image (PNG with transparency)
   - Add a prompt describing the product placement

## Step 13: Add CTA to Storefront

The customer-facing modal needs to be embedded in your product pages. You have two options:

### Option A: Theme App Extension (Recommended)

Create a theme app extension that adds a button to product pages:

1. Create `extensions/see-it-button/` directory in your app
2. Add a liquid template that renders the button
3. The button should open the modal with product context

Example button code:
```liquid
<button 
  onclick="window.open('https://your-app-domain.com?productId={{ product.id }}&variantId={{ product.selected_or_first_available_variant.id }}', 'SeeIt', 'width=420,height=800')"
  class="see-it-button"
>
  See It In Your Home
</button>
```

### Option B: Manual Integration

Add this to your product template (Online Store 2.0):

```html
<div class="see-it-cta">
  <button 
    id="see-it-button"
    data-product-id="{{ product.id }}"
    data-variant-id="{{ product.selected_or_first_available_variant.id }}"
    data-product-title="{{ product.title }}"
  >
    See It In Your Home
  </button>
</div>

<script>
  document.getElementById('see-it-button').addEventListener('click', function() {
    const productId = this.dataset.productId;
    const variantId = this.dataset.variantId;
    const productTitle = this.dataset.productTitle;
    
    window.open(
      `https://your-app-domain.com?productId=${productId}&variantId=${variantId}&productTitle=${encodeURIComponent(productTitle)}`,
      'SeeIt',
      'width=420,height=800'
    );
  });
</script>
```

### Option C: Headless Storefront

For headless storefronts, embed the app using an iframe or script tag that loads the modal.

## Step 14: Test the Installation

1. **Test Admin Interface:**
   - Go to Shopify admin → Apps → Your app
   - Verify you can see products
   - Configure metafields for a test product
   - Test sandbox preview generation

2. **Test Customer Modal:**
   - Visit a product page on your storefront
   - Click the "See It In Your Home" button
   - Test the full flow:
     - Upload/capture a room photo
     - Crop the image
     - Place the product
     - Generate preview
     - Send email

## Troubleshooting

### Admin Interface Not Loading

- Verify app URL is correct in Partner Dashboard
- Check that app is installed on the store
- Ensure `NEXT_PUBLIC_SHOPIFY_API_KEY` is set correctly
- Check browser console for errors

### Session Token Errors

- Verify `SHOPIFY_API_KEY` matches your app's API key
- Check that `SHOPIFY_SHOP` and `SHOPIFY_ALLOWED_SHOPS` include your store domain
- Ensure backend is accessible from frontend

### Product Data Not Loading

- Verify `SHOPIFY_ADMIN_ACCESS_TOKEN` is set correctly
- Check that scopes include `read_products`
- Verify metafields exist for the product

### Preview Generation Failing

- Check Vertex AI quota and API access
- Verify `VERTEX_LOCATION` and `VERTEX_MODEL` are correct
- Check Cloud Run logs: `gcloud run services logs read see-it-backend`

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

## Key Differences from Traditional Shopify Apps

This app uses **Shopify App Bridge**, which means:

1. **No OAuth Flow Needed** - Shopify handles authentication automatically
2. **Session Tokens** - Provided via App Bridge `getSessionToken()`
3. **Embedded in Admin** - Admin interface loads directly in Shopify admin
4. **Storefront Integration** - Customer modal embedded in product pages
5. **Simpler Setup** - Less code, Shopify handles more infrastructure

The backend still needs an Admin API access token to read product data, but the frontend authentication is handled entirely by App Bridge.
