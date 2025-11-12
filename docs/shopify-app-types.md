# Shopify App Types & Architecture Options

This guide explains the different types of Shopify apps and architectural patterns you can choose from.

## App Categories

### 1. Public Apps vs Custom Apps

#### Public Apps
- **Purpose**: Distributed to multiple merchants via Shopify App Store
- **Installation**: Merchants install from App Store
- **OAuth**: Required - each merchant goes through OAuth flow
- **Access Tokens**: Generated per-store during OAuth
- **Use Case**: SaaS products, multi-tenant apps
- **Example**: Klaviyo, Yotpo, ReCharge

#### Custom Apps
- **Purpose**: Built for a single merchant or internal use
- **Installation**: Created directly in merchant's admin
- **OAuth**: Not required - direct API access
- **Access Tokens**: Generated immediately when app is created
- **Use Case**: Internal tools, single-store solutions
- **Example**: Your own store's custom integrations

**Your current app**: Uses App Bridge (can be either public or custom)

---

## App Architecture Types

### 1. App Bridge Apps (Modern, Recommended)

**What it is**: Apps that embed directly in Shopify admin using Shopify's App Bridge framework.

**Characteristics**:
- ✅ Embedded in Shopify admin (seamless UX)
- ✅ Automatic authentication via session tokens
- ✅ No OAuth flow needed (Shopify handles it)
- ✅ Uses `@shopify/app-bridge` library
- ✅ Can also embed in storefront (with restrictions)

**Authentication**:
- Session tokens via `getSessionToken()` from App Bridge
- Tokens are short-lived JWTs
- Automatically refreshed by Shopify

**Best for**:
- Admin interfaces
- Merchant-facing tools
- Apps that need to feel native to Shopify

**Your current app**: ✅ Uses App Bridge

**Example Structure**:
```
Frontend (Next.js/React)
├── /admin - Admin interface (embedded in Shopify admin)
└── / - Customer-facing modal (embedded in storefront)
```

---

### 2. Standalone Apps (Traditional OAuth)

**What it is**: Apps that run on your own domain, redirect users for OAuth.

**Characteristics**:
- ✅ Full control over UI/UX
- ✅ Can be completely custom design
- ✅ Runs on your domain
- ❌ Requires OAuth implementation
- ❌ Users leave Shopify admin

**Authentication**:
- OAuth 2.0 flow
- Long-lived access tokens stored in your database
- Token refresh required

**Best for**:
- Complex admin interfaces
- Apps that need custom branding
- Legacy integrations

**Example Flow**:
```
1. Merchant clicks "Install app" in Shopify
2. Redirects to your OAuth endpoint
3. Merchant authorizes scopes
4. Shopify redirects back with code
5. Exchange code for access token
6. Store token, redirect to your app
```

---

### 3. Embedded Apps (Legacy)

**What it is**: Older way to embed apps in Shopify admin (deprecated in favor of App Bridge).

**Characteristics**:
- ⚠️ Deprecated - use App Bridge instead
- Uses iframe embedding
- More complex authentication

**Status**: Shopify recommends migrating to App Bridge

---

## Storefront Integration Options

### 1. Theme App Extensions

**What it is**: Native Shopify extension that adds UI blocks to themes.

**Characteristics**:
- ✅ Native Shopify integration
- ✅ Works with Online Store 2.0 themes
- ✅ Merchants can enable/disable in Theme Editor
- ✅ No code changes needed by merchant
- ✅ Automatic updates

**Best for**:
- Adding buttons/widgets to product pages
- Cart modifications
- Checkout enhancements

**Your current app**: Mentions support for theme app extensions

**Structure**:
```
extensions/
└── see-it-button/
    ├── blocks/
    │   └── see-it-button.liquid
    └── assets/
        └── see-it-button.css
```

---

### 2. Script Tags

**What it is**: JavaScript injected into storefront via Admin API.

**Characteristics**:
- ✅ Works on any theme
- ✅ Can inject scripts globally
- ✅ Managed via Admin API
- ❌ Can conflict with other scripts
- ❌ Less control over placement

**Best for**:
- Analytics
- Global widgets
- Third-party integrations

**Example**:
```javascript
// Create script tag via Admin API
POST /admin/api/2024-07/script_tags.json
{
  "script_tag": {
    "event": "onload",
    "src": "https://your-app.com/widget.js"
  }
}
```

---

### 3. App Blocks (Online Store 2.0)

**What it is**: App-provided blocks that merchants can add to sections.

**Characteristics**:
- ✅ Native to Shopify themes
- ✅ Merchants drag-and-drop in Theme Editor
- ✅ App controls the block content
- ✅ Can update blocks remotely

**Best for**:
- Product page enhancements
- Homepage widgets
- Section-level features

---

### 4. Checkout Extensions

**What it is**: Extensions that modify Shopify Checkout.

**Types**:
- **Checkout UI Extensions**: Custom UI in checkout
- **Functions**: Backend logic (discounts, shipping)
- **Post-purchase UI**: Post-checkout experience

**Characteristics**:
- ✅ Native checkout integration
- ✅ Secure and sandboxed
- ✅ Can modify checkout flow
- ⚠️ Requires specific APIs

**Best for**:
- Upsells
- Custom checkout fields
- Post-purchase offers

---

### 5. Headless/API-Only Integration

**What it is**: App provides API endpoints, storefront calls them directly.

**Characteristics**:
- ✅ Works with any storefront (headless or not)
- ✅ Full control over integration
- ✅ Can be embedded via iframe or script
- ❌ Requires custom storefront code
- ❌ More complex setup

**Your current app**: Uses this approach for customer modal

**Example**:
```html
<!-- Merchant adds to product template -->
<button onclick="openSeeItModal('{{ product.id }}')">
  See It In Your Home
</button>

<script>
function openSeeItModal(productId) {
  window.open(
    `https://your-app.com?productId=${productId}`,
    'SeeIt',
    'width=420,height=800'
  );
}
</script>
```

---

## API Access Patterns

### 1. Admin API

**What it is**: Full access to store data (products, orders, customers, etc.)

**Access Methods**:
- **OAuth Access Token**: Long-lived, per-store (for public apps)
- **Admin API Access Token**: Direct access (for custom apps)
- **Session Token**: Short-lived, from App Bridge (for embedded apps)

**Use Cases**:
- Reading/writing products
- Managing orders
- Customer data
- Store configuration

**Your current app**: Uses Admin API via `SHOPIFY_ADMIN_ACCESS_TOKEN`

---

### 2. Storefront API

**What it is**: GraphQL API for storefront data (public-facing).

**Characteristics**:
- ✅ Public API (no sensitive data)
- ✅ GraphQL-based
- ✅ Optimized for storefronts
- ✅ Can be called from browser

**Use Cases**:
- Product listings
- Cart operations
- Customer accounts (with authentication)

**Access**:
- Storefront API Access Token (public, per-store)
- Customer Access Token (for authenticated customers)

---

### 3. Customer Account API

**What it is**: API for customer account management (new, 2024).

**Characteristics**:
- ✅ Customer self-service
- ✅ Account management
- ✅ Order history

**Use Cases**:
- Customer portals
- Account management apps

---

## Your Current App Architecture

Based on your codebase, here's what you're using:

### Architecture Type
- **App Bridge App** ✅
- **Public App** (can be distributed via App Store)
- **Hybrid**: Admin interface + Storefront integration

### Components

1. **Admin Interface** (`/admin`)
   - Embedded in Shopify admin via App Bridge
   - Uses session tokens for authentication
   - Manages product metafields

2. **Customer Modal** (`/`)
   - Embedded in storefront (not Shopify admin)
   - Uses session tokens from App Bridge
   - Can also work standalone with query params

3. **Backend API**
   - Uses Admin API access token for product data
   - Validates session tokens from frontend
   - Handles preview generation, storage, emails

### Integration Points

**Storefront Integration**:
- Option A: Theme App Extension (recommended)
- Option B: Manual script/button embed
- Option C: Headless storefront integration

**Admin Integration**:
- Automatic via App Bridge
- Loads when merchant clicks app in Shopify admin
- URL: `https://your-app.com/admin?host=...`

---

## Choosing the Right Architecture

### Use App Bridge If:
- ✅ You want seamless admin integration
- ✅ You want Shopify to handle authentication
- ✅ You're building merchant-facing tools
- ✅ You want modern, supported approach

### Use Standalone OAuth If:
- ✅ You need complete UI control
- ✅ You're building complex admin interfaces
- ✅ You want custom branding
- ✅ You're okay with users leaving Shopify

### Use Theme Extensions If:
- ✅ You want native theme integration
- ✅ Merchants should control placement
- ✅ You're adding storefront features
- ✅ You want automatic updates

### Use Headless Integration If:
- ✅ You're working with custom storefronts
- ✅ You need full control over integration
- ✅ You're building API-first products

---

## Migration Paths

### From Standalone to App Bridge
1. Add App Bridge library
2. Replace OAuth flow with session tokens
3. Update authentication middleware
4. Test embedded experience

### From Legacy Embedded to App Bridge
1. Update to App Bridge v3
2. Replace iframe embedding
3. Update authentication
4. Test in Shopify admin

---

## Recommendations for Your App

Based on your current setup, you're on the right track:

✅ **Keep App Bridge** - Modern, supported, handles auth automatically
✅ **Add Theme Extension** - Makes storefront integration easier for merchants
✅ **Consider Checkout Extension** - If you want to add checkout features later
✅ **Stay Public App Ready** - Your architecture supports App Store distribution

**Next Steps**:
1. Create theme app extension for easier storefront integration
2. Consider adding checkout UI extension if needed
3. Prepare for App Store submission (if going public)

---

## Resources

- [Shopify App Bridge Docs](https://shopify.dev/docs/apps/tools/app-bridge)
- [Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [Checkout Extensions](https://shopify.dev/docs/apps/checkout)
- [Admin API](https://shopify.dev/docs/api/admin)
- [Storefront API](https://shopify.dev/docs/api/storefront)
