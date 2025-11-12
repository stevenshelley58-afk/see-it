# Permissions Required - Complete Guide

This guide covers all permissions you need for the See It app.

---

## 1. Shopify App Permissions (Scopes)

### Required Scopes

When creating your Shopify app (Custom App or Public App), you need these scopes:

#### Required (Core Functionality)
- ✅ **`read_products`** - Read product data and metafields
- ✅ **`read_product_listings`** - Read product listings for storefront

#### Required (Email Functionality)
- ✅ **`write_customers`** - Create/update customer records for email consent

#### Optional (Future Features)
- ⚠️ **`read_assigned_fulfillment_orders`** - For future fulfillment features (not needed now)

### How to Set Scopes

#### Option A: Custom App (MVP - Your Store)
1. Shopify Admin → **Settings** → **Apps and sales channels**
2. **Develop apps** → **Create an app**
3. Click **Configure Admin API scopes**
4. Enable:
   - ✅ `read_products`
   - ✅ `read_product_listings`
   - ✅ `write_customers`
5. **Save**
6. **Install app**
7. Get Admin API token

#### Option B: Partner Dashboard App (For App Store)
1. Partner Dashboard → Your app
2. **App setup** → **Scopes**
3. Add scopes:
   - `read_products`
   - `read_product_listings`
   - `write_customers`
4. **Save**

### What Each Scope Does

| Scope | Why You Need It | Used For |
|-------|----------------|----------|
| `read_products` | Read product data, images, metafields | Loading product config, images |
| `read_product_listings` | Read storefront product data | Product listings, variants |
| `write_customers` | Store email consent | Email functionality |

---

## 2. Google Cloud Platform Permissions

### Service Account Permissions

Your backend service account needs these roles:

#### Required Roles

```bash
# Firestore access
roles/datastore.user

# Cloud Storage access
roles/storage.objectAdmin

# Vertex AI access
roles/aiplatform.user
```

### How to Set Up

```bash
# Create service account
gcloud iam service-accounts create see-it-backend \
  --display-name="See It Backend Service Account"

# Grant Firestore access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:see-it-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Grant Storage access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:see-it-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Grant Vertex AI access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:see-it-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### API Enablement

Enable these APIs in your GCP project:

```bash
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable compute.googleapis.com
```

### Bucket Permissions

Your Cloud Storage bucket needs:

- **Public read access** (for generated previews)
- **CORS configuration** (for uploads from storefront)
- **Lifecycle rules** (auto-delete after 30 days)

Set via:
```bash
gsutil cors set docs/snippets/gcs-cors.json gs://your-bucket
gsutil lifecycle set docs/snippets/gcs-lifecycle.json gs://your-bucket
```

---

## 3. Theme Editing Permissions

### For Manual Installation (No App)

If you're adding the button manually to your theme:

**Required**: 
- ✅ **Theme Editor access** (you have this as store owner)
- ✅ **Code editor access** (to add snippets)

**No special permissions needed** - store owners can always edit themes.

### For Theme App Extension

If using the Theme App Extension:

**Required**:
- ✅ App installed on store
- ✅ App has theme extension permissions (automatic with App Bridge)

**No additional permissions needed** - extension works automatically.

---

## 4. Postmark Permissions

### Required Setup

1. **Server API Token** - Get from Postmark dashboard
2. **Sender Signature** - Verify your email domain
3. **Template Access** - Create/use email template

### How to Get

1. Sign up at [Postmark](https://postmarkapp.com)
2. Create a **Server**
3. Get **Server API Token**
4. Verify **Sender Signature** (your email domain)
5. Create email template
6. Get **Template ID**

**No special permissions** - just API tokens.

---

## 5. Vercel Permissions

### For Frontend Deployment

**Required**:
- ✅ Vercel account
- ✅ Project access
- ✅ Environment variables access

**No special permissions** - standard Vercel account works.

---

## 6. Shopify Partner Account

### For App Development

**Required**:
- ✅ Shopify Partner account (free)
- ✅ Development store (free, for testing)

**How to Get**:
1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Sign up (free)
3. Create development store (free)

---

## 7. Session Token Permissions

### App Bridge Session Tokens

**Required Scopes in Session Token**:
- ✅ `read_products` (validated by backend)

**How It Works**:
- Session tokens are automatically generated by Shopify
- Backend validates token has `read_products` scope
- No manual setup needed

**Backend Validation**:
```typescript
// backend/src/middleware/shopifyAuth.ts
// Validates session token has read_products scope
```

---

## 8. Environment Variables Checklist

### Backend Required

```env
# Shopify
SHOPIFY_API_KEY=xxx              # From Partner Dashboard
SHOPIFY_API_SECRET=xxx           # From Partner Dashboard
SHOPIFY_ADMIN_ACCESS_TOKEN=xxx   # From Custom App
SHOPIFY_SHOP=store.myshopify.com
SHOPIFY_SCOPES=read_products,read_product_listings

# GCP
GCP_PROJECT_ID=xxx
GCS_BUCKET_NAME=xxx

# Vertex AI
VERTEX_LOCATION=us-central1
VERTEX_MODEL=publishers/google/models/gemini-2.5-flash-image

# Postmark
POSTMARK_SERVER_TOKEN=xxx
POSTMARK_FROM_EMAIL=xxx
POSTMARK_TEMPLATE_ID=xxx
```

### Frontend Required

```env
NEXT_PUBLIC_BACKEND_URL=xxx
NEXT_PUBLIC_SHOPIFY_API_KEY=xxx  # Same as backend
```

---

## 9. Quick Permission Checklist

### For MVP (Your Store)

- [ ] **Shopify Custom App** created
- [ ] **Scopes enabled**: `read_products`, `read_product_listings`, `write_customers`
- [ ] **Admin API token** obtained
- [ ] **GCP project** created
- [ ] **APIs enabled** (Firestore, Storage, Vertex AI)
- [ ] **Service account** created with required roles
- [ ] **Postmark account** created
- [ ] **Sender signature** verified
- [ ] **Theme editing access** (you have this as owner)

### For App Store (Multi-Store)

- [ ] **Partner Dashboard app** created
- [ ] **Scopes configured** in Partner Dashboard
- [ ] **OAuth flow** implemented
- [ ] **Database** for storing store tokens
- [ ] **Webhook handlers** for uninstall
- [ ] **Theme extension** deployed

---

## 10. Permission Troubleshooting

### "Missing Shopify session token"
- ✅ Check app is installed on store
- ✅ Check `NEXT_PUBLIC_SHOPIFY_API_KEY` is set
- ✅ Check app URL is correct in Partner Dashboard

### "Missing SHOPIFY_ADMIN_ACCESS_TOKEN"
- ✅ Create Custom App in Shopify admin
- ✅ Enable required scopes
- ✅ Install app
- ✅ Get Admin API token
- ✅ Add to backend `.env`

### "Permission denied" on GCP
- ✅ Check service account has required roles
- ✅ Check APIs are enabled
- ✅ Check service account is set in Cloud Run

### "403 Forbidden" on Storage
- ✅ Check bucket CORS configuration
- ✅ Check bucket is public (for reads)
- ✅ Check service account has `storage.objectAdmin` role

### "Invalid scope" errors
- ✅ Check scopes are enabled in app settings
- ✅ Check scopes match what you're requesting
- ✅ Reinstall app if scopes changed

---

## 11. Minimal Permissions for Testing

If you just want to test quickly:

### Minimum Required

1. **Shopify Custom App** with:
   - `read_products` scope
   - Admin API token

2. **GCP** with:
   - Firestore enabled
   - Storage bucket created
   - Service account with basic roles

3. **Theme editing** (you have this)

**You can skip**:
- ❌ Postmark (use mock emails)
- ❌ Vertex AI (use mock previews)
- ❌ Partner Dashboard app (use Custom App)

---

## Summary

### Must Have
- ✅ Shopify app with `read_products`, `read_product_listings`, `write_customers`
- ✅ GCP service account with Firestore, Storage, Vertex AI roles
- ✅ Theme editing access (for manual install)

### Nice to Have
- ✅ Postmark (for real emails)
- ✅ Vertex AI (for real previews)
- ✅ Partner Dashboard app (for App Store)

### Don't Need
- ❌ Special Shopify Partner permissions
- ❌ Special Vercel permissions
- ❌ Special Postmark permissions

---

**Questions?** Check the troubleshooting section or see the main installation guide!
