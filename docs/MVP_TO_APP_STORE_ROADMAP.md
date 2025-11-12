# Roadmap: MVP → App Store

This guide outlines the path from running on your own store (MVP) to selling on the Shopify App Store.

## Phase 1: MVP on Your Own Store (Current State) ✅

### What You Have
- ✅ App Bridge app (works great for single store)
- ✅ Session token authentication (frontend)
- ✅ Admin API token (backend - single store)
- ✅ Admin interface (`/admin`)
- ✅ Customer modal (`/`)
- ✅ Backend API (Cloud Run)

### What Works Now
- Install as **Custom App** in your store
- Use `SHOPIFY_ADMIN_ACCESS_TOKEN` for backend
- Session tokens work automatically
- Perfect for MVP iteration

### Current Limitations
- ❌ Only works for one store (your store)
- ❌ Can't distribute to other merchants yet
- ❌ No OAuth flow (not needed for single store)

---

## Phase 2: Prepare for Multi-Store (Before App Store)

### What Needs to Change

#### 2.1 Backend: Store Access Tokens Per Shop

**Current**: Single `SHOPIFY_ADMIN_ACCESS_TOKEN` in env
**Needed**: Database to store tokens per store

**Changes Required**:

1. **Add Database Table** (Firestore collection):
```typescript
// stores collection
{
  shop: "store.myshopify.com",
  accessToken: "shpat_xxx", // encrypted
  scopes: ["read_products", ...],
  installedAt: timestamp,
  uninstalledAt: timestamp | null
}
```

2. **Update Shopify Service**:
```typescript
// backend/src/services/shopify.ts
async function getAccessToken(shop: string): Promise<string> {
  const store = await firestore.getStore(shop);
  if (!store || !store.accessToken) {
    throw new Error('Store not installed or token missing');
  }
  return decrypt(store.accessToken);
}
```

3. **Update Routes** to use shop-specific tokens:
```typescript
// Use shop from session token to get access token
const shop = req.shopifySession?.shop;
const accessToken = await getAccessToken(shop);
```

#### 2.2 Add OAuth Flow

**Why**: When merchants install from App Store, Shopify redirects to your OAuth endpoint.

**Create OAuth Endpoints**:

```typescript
// backend/src/routes/oauth.ts

// Step 1: Initiate OAuth
app.get('/auth/shopify', (req, res) => {
  const shop = req.query.shop as string;
  const redirectUri = `${BACKEND_URL}/auth/shopify/callback`;
  const scopes = 'read_products,read_product_listings,write_customers';
  
  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${SHOPIFY_API_KEY}&` +
    `scope=${scopes}&` +
    `redirect_uri=${redirectUri}`;
  
  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback
app.get('/auth/shopify/callback', async (req, res) => {
  const { code, shop } = req.query;
  
  // Exchange code for access token
  const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code
    })
  });
  
  const { access_token, scope } = await tokenResponse.json();
  
  // Store in database
  await firestore.saveStore({
    shop,
    accessToken: encrypt(access_token),
    scopes: scope.split(','),
    installedAt: new Date()
  });
  
  // Redirect to app
  res.redirect(`https://${FRONTEND_URL}/admin?shop=${shop}&host=...`);
});
```

#### 2.3 Update Frontend App URL

**In Partner Dashboard**:
- Set **App URL**: `https://your-app.com/admin`
- Set **Allowed redirection URL**: `https://your-backend.com/auth/shopify/callback`

#### 2.4 Handle App Uninstall Webhook

```typescript
// backend/src/routes/webhooks.ts
app.post('/webhooks/app/uninstalled', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  await firestore.markStoreUninstalled(shop);
  res.status(200).send('OK');
});
```

**Register webhook** in Partner Dashboard or via API.

---

## Phase 3: App Store Requirements

### 3.1 Partner Dashboard Setup

1. **Complete App Listing**:
   - App name, description, tagline
   - Screenshots (required):
     - Admin interface screenshot
     - Storefront integration screenshot
     - Mobile view (if applicable)
   - App icon (1024x1024px)
   - Support email
   - Privacy policy URL
   - Terms of service URL

2. **Pricing**:
   - Free plan (if applicable)
   - Paid plans (if applicable)
   - Billing API integration

3. **App Details**:
   - Category
   - Tags/keywords
   - Support documentation URL

### 3.2 Technical Requirements

#### Required Scopes
- ✅ `read_products` - You have this
- ✅ `read_product_listings` - You have this
- ✅ `write_customers` - You have this
- ⚠️ Only request what you need (review process checks this)

#### App Bridge Compliance
- ✅ You're using App Bridge (good!)
- ✅ Session tokens (correct)
- ✅ Embedded admin interface

#### Security Requirements
- ✅ HTTPS only (Vercel/Cloud Run provide this)
- ✅ Session token validation (you have this)
- ✅ Secure token storage (encrypt in database)
- ⚠️ Privacy policy (required)
- ⚠️ GDPR compliance (if EU merchants)

#### Performance Requirements
- ✅ Fast load times (< 3s)
- ✅ Responsive design
- ✅ Error handling
- ⚠️ Rate limiting (you have basic rate limiting)

### 3.3 Theme App Extension (Highly Recommended)

**Why**: Makes installation easier for merchants.

**Create Extension**:
```
extensions/
└── see-it-button/
    ├── shopify.extension.toml
    ├── blocks/
    │   └── see-it-button.liquid
    └── assets/
        └── see-it-button.css
```

**Benefits**:
- Merchants enable in Theme Editor (no code)
- Automatic updates
- Better App Store listing

### 3.4 Billing (If Paid App)

**Options**:
1. **Recurring Application Charge** (RAC)
2. **Usage-based billing** (if applicable)
3. **One-time charge** (less common)

**Implementation**:
```typescript
// backend/src/routes/billing.ts
app.post('/billing/activate', async (req, res) => {
  const shop = req.shopifySession?.shop;
  // Create charge via Admin API
  // Redirect merchant to approve
});
```

---

## Phase 4: Code Structure for Both MVP & App Store

### 4.1 Environment-Based Configuration

**Create config helper**:
```typescript
// backend/src/config.ts
export const config = {
  isMultiStore: process.env.MULTI_STORE === 'true',
  useOAuth: process.env.USE_OAUTH === 'true',
  // ... other config
};
```

**Conditional logic**:
```typescript
// Use OAuth tokens if multi-store, else env token
const accessToken = config.isMultiStore
  ? await getAccessTokenFromDB(shop)
  : process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
```

### 4.2 Feature Flags

Use feature flags to enable/disable App Store features:
```typescript
// Enable OAuth only when ready
if (config.useOAuth) {
  app.use('/auth', oauthRoutes);
}
```

### 4.3 Database Schema

**Design for both**:
```typescript
// Firestore collections
stores/              // Multi-store support
  {shopId}/
    accessToken: encrypted
    scopes: string[]
    installedAt: timestamp
    plan: 'free' | 'pro' | 'enterprise'
    
sessions/            // You already have this
  {sessionId}/
    shop: string
    productId: string
    ...
```

---

## Phase 5: Testing Strategy

### 5.1 MVP Testing (Your Store)
- ✅ Test on your own store
- ✅ Iterate quickly
- ✅ Fix bugs
- ✅ Gather feedback

### 5.2 Pre-App Store Testing
- [ ] Test OAuth flow with development app
- [ ] Test with 2-3 beta stores
- [ ] Test uninstall flow
- [ ] Test billing (if applicable)
- [ ] Load testing
- [ ] Security audit

### 5.3 App Store Testing
- [ ] Shopify review process
- [ ] Address feedback
- [ ] Resubmit if needed

---

## Recommended Timeline

### Week 1-2: MVP on Your Store
- ✅ Deploy to your store
- ✅ Test end-to-end
- ✅ Fix critical bugs
- ✅ Iterate on UX

### Week 3-4: Multi-Store Prep
- [ ] Add database for store tokens
- [ ] Implement OAuth flow
- [ ] Add webhook handlers
- [ ] Test with beta stores

### Week 5-6: App Store Prep
- [ ] Create theme extension
- [ ] Write app listing copy
- [ ] Take screenshots
- [ ] Set up billing (if paid)
- [ ] Privacy policy & terms

### Week 7: Submit to App Store
- [ ] Complete Partner Dashboard
- [ ] Submit for review
- [ ] Address feedback
- [ ] Launch! 🚀

---

## MVP-First Approach Benefits

### Why Start with MVP?

1. **Faster Iteration**
   - No OAuth complexity initially
   - Focus on core features
   - Test on real store

2. **Validate Product-Market Fit**
   - See if merchants actually want it
   - Gather feedback
   - Iterate before investing in App Store

3. **Lower Risk**
   - Test infrastructure at scale
   - Find bugs early
   - Optimize performance

4. **Easier Debugging**
   - One store = simpler logs
   - Faster troubleshooting
   - Direct merchant feedback

### When to Add Multi-Store?

**Add OAuth when**:
- ✅ MVP is stable
- ✅ You have 5-10 merchants asking for it
- ✅ You're ready to support multiple stores
- ✅ You have time for App Store submission

**Don't add too early**:
- ❌ Before MVP is stable
- ❌ Before validating demand
- ❌ If it slows down iteration

---

## Quick Start: MVP Setup

### 1. Deploy to Your Store (Today)

```bash
# Backend
cd backend
cp env.sample .env
# Fill in your store details
npm run dev

# Frontend  
cd frontend
cp env.sample .env.local
# Fill in your app details
npm run dev
```

### 2. Create Custom App in Your Store

1. Shopify Admin → Settings → Apps
2. Develop apps → Create app
3. Get Admin API token
4. Add to backend `.env`

### 3. Install App Bridge App

1. Partner Dashboard → Create app
2. Set App URL to your frontend
3. Install on your store
4. Test admin interface

### 4. Add Storefront Integration

Add button to product template (manual for now):
```liquid
<button onclick="window.open('https://your-app.com?productId={{ product.id }}', 'SeeIt')">
  See It In Your Home
</button>
```

### 5. Iterate!

- Test with real products
- Fix bugs
- Improve UX
- Add features

---

## Migration Checklist: MVP → App Store

### Backend Changes
- [ ] Add Firestore `stores` collection
- [ ] Implement OAuth endpoints (`/auth/shopify`, `/auth/shopify/callback`)
- [ ] Update `shopify.ts` to use database tokens
- [ ] Add webhook handlers (uninstall, etc.)
- [ ] Encrypt access tokens in database
- [ ] Add multi-store error handling
- [ ] Update CORS to allow any shop (or whitelist)

### Frontend Changes
- [ ] Update App URL in Partner Dashboard
- [ ] Handle OAuth redirect flow
- [ ] Add error handling for uninstalled stores
- [ ] Update admin interface for multi-store

### Infrastructure
- [ ] Set up webhook endpoints
- [ ] Configure webhook subscriptions
- [ ] Add monitoring/alerts for multi-store
- [ ] Scale infrastructure (if needed)

### App Store Prep
- [ ] Create theme app extension
- [ ] Write app listing copy
- [ ] Take screenshots
- [ ] Create app icon
- [ ] Write privacy policy
- [ ] Write terms of service
- [ ] Set up support email
- [ ] Configure billing (if paid)

### Testing
- [ ] Test OAuth flow end-to-end
- [ ] Test with 2-3 beta stores
- [ ] Test uninstall flow
- [ ] Load testing
- [ ] Security review

---

## Code Examples: Key Changes Needed

### Example 1: Store Token Management

```typescript
// backend/src/services/stores.ts
export const stores = {
  async save(shop: string, accessToken: string, scopes: string[]) {
    await firestore.collection('stores').doc(shop).set({
      accessToken: encrypt(accessToken),
      scopes,
      installedAt: new Date(),
      uninstalledAt: null
    });
  },
  
  async getAccessToken(shop: string): Promise<string> {
    const doc = await firestore.collection('stores').doc(shop).get();
    if (!doc.exists) {
      throw new Error('Store not installed');
    }
    const data = doc.data();
    return decrypt(data.accessToken);
  },
  
  async uninstall(shop: string) {
    await firestore.collection('stores').doc(shop).update({
      uninstalledAt: new Date()
    });
  }
};
```

### Example 2: OAuth Routes

```typescript
// backend/src/routes/oauth.ts
import express from 'express';
import { stores } from '../services/stores.js';

const router = express.Router();

router.get('/auth/shopify', (req, res) => {
  const shop = req.query.shop as string;
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }
  
  const redirectUri = `${process.env.BACKEND_URL}/auth/shopify/callback`;
  const scopes = 'read_products,read_product_listings,write_customers';
  
  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${process.env.SHOPIFY_API_KEY}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  res.redirect(authUrl);
});

router.get('/auth/shopify/callback', async (req, res) => {
  const { code, shop } = req.query;
  
  if (!code || !shop) {
    return res.status(400).json({ error: 'Missing code or shop' });
  }
  
  try {
    // Exchange code for token
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      })
    });
    
    const { access_token, scope } = await response.json();
    
    // Save to database
    await stores.save(shop as string, access_token, scope.split(','));
    
    // Redirect to app
    const host = Buffer.from(`${shop}/admin`).toString('base64');
    res.redirect(`${process.env.FRONTEND_URL}/admin?shop=${shop}&host=${host}`);
  } catch (error) {
    res.status(500).json({ error: 'OAuth failed' });
  }
});

export { router as oauthRouter };
```

### Example 3: Update Shopify Service

```typescript
// backend/src/services/shopify.ts
import { stores } from './stores.js';

async function getAccessToken(shop: string): Promise<string> {
  // If multi-store mode, get from database
  if (process.env.MULTI_STORE === 'true') {
    return await stores.getAccessToken(shop);
  }
  // Otherwise use env token (MVP mode)
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!token) {
    throw new Error('Missing SHOPIFY_ADMIN_ACCESS_TOKEN');
  }
  return token;
}

export const shopify = {
  async fetchProductConfig(productId: string, variantId: string, shop: string) {
    const accessToken = await getAccessToken(shop);
    // Use accessToken in API calls...
  }
};
```

---

## Next Steps

1. **This Week**: Get MVP running on your store
2. **Next Week**: Iterate and fix bugs
3. **Week 3**: Start planning multi-store architecture
4. **Week 4+**: Implement OAuth when ready

**Focus on MVP first** - validate the product before investing in App Store infrastructure!

Want help implementing any of these? I can help with:
- OAuth implementation
- Database schema design
- Theme app extension
- App Store listing prep
