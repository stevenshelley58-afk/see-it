# Installing Theme Extension on Your Store

## Quick Answer

**Theme App Extensions require a Shopify app**, but you can create a simple development app just for your own store. Here's how:

---

## Option 1: Using Shopify CLI (Easiest)

### Step 1: Install Shopify CLI

```bash
npm install -g @shopify/cli @shopify/theme
```

### Step 2: Create/Use Development App

If you don't have a Shopify Partner account yet:

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Sign up (free)
3. Create a development store (free, for testing)

### Step 3: Link Your Extension

```bash
# Navigate to your project root
cd /workspace

# Login to Shopify CLI
shopify auth login

# Create a new app (or link existing)
shopify app generate extension

# Or if you already have an app:
shopify app link
```

### Step 4: Deploy Extension

```bash
# Deploy the extension to your store
shopify app deploy

# Or for development:
shopify app dev
```

### Step 5: Install on Your Store

1. Go to your Shopify admin
2. Apps → Your app name
3. Install/Enable
4. Go to Theme Editor
5. Add the "See It In Your Home" block

---

## Option 2: Manual Installation (No App Needed)

If you want to skip the app entirely and just add the button directly to your theme:

### Step 1: Copy the Button Code

Create a new file in your theme: `snippets/see-it-button.liquid`

```liquid
{% comment %}
  See It In Your Home Button
  Add this to your product template
{% endcomment %}

{% liquid
  assign product_id = product.id | split: '/' | last
  assign variant_id = product.selected_or_first_available_variant.id | split: '/' | last
  assign product_title = product.title | escape
  assign shop_domain = shop.domain
  assign locale = request.locale.iso_code | default: 'en'
  assign app_url = 'https://your-app-url.com'  # UPDATE THIS!
  assign modal_url = app_url | append: '?productId=' | append: product_id | append: '&variantId=' | append: variant_id | append: '&productTitle=' | append: product_title | append: '&locale=' | append: locale | append: '&shop=' | append: shop_domain
%}

<div class="see-it-button-wrapper" style="text-align: center; margin: 20px 0;">
  <button
    type="button"
    class="see-it-button"
    onclick="openSeeItModal('{{ modal_url | escape }}')"
    style="background-color: #000; color: #fff; border: none; padding: 12px 24px; font-size: 16px; border-radius: 4px; cursor: pointer; font-weight: 600;"
  >
    See It In Your Home
  </button>
</div>

<script>
  function openSeeItModal(url) {
    const width = 420;
    const height = 800;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    window.open(url, 'SeeIt', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`).focus();
  }
</script>
```

### Step 2: Add to Product Template

1. Go to **Online Store** → **Themes** → **Actions** → **Edit code**
2. Open `templates/product.liquid` (or your product template)
3. Find where you want the button (usually near "Add to Cart")
4. Add:

```liquid
{% render 'see-it-button' %}
```

### Step 3: Update App URL

In `snippets/see-it-button.liquid`, change:
```liquid
assign app_url = 'https://your-app-url.com'
```

To your actual app URL.

---

## Option 3: Development App (Recommended for Testing)

Create a minimal app just for your store:

### Step 1: Create App in Partner Dashboard

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. **Apps** → **Create app**
3. Choose **Create app manually**
4. Name it (e.g., "See It - Development")
5. Set **App URL**: `http://localhost:3000/admin` (for now)
6. Get your **API Key** and **API Secret**

### Step 2: Update Extension Config

In `extensions/see-it-button/shopify.extension.toml`, make sure it looks like:

```toml
api_version = "2024-07"
name = "see-it-button"
type = "theme"

[extension_points]
  [extension_points.app_blocks]
```

### Step 3: Update Button Code

In `extensions/see-it-button/blocks/see-it-button.liquid`, update the app URL:

```liquid
assign app_url = block.settings.app_url | default: 'https://your-deployed-app.com'
```

### Step 4: Use Shopify CLI

```bash
# Login
shopify auth login

# Create app structure (if needed)
shopify app init

# Link to your app
shopify app link

# Deploy extension
shopify app deploy
```

### Step 5: Install on Store

1. Shopify Admin → **Apps** → **App and sales channel settings**
2. Find your app → **Install**
3. Go to **Theme Editor**
4. Add the block

---

## Which Option Should You Use?

### Use Option 1 (Shopify CLI) if:
- ✅ You want the full app extension experience
- ✅ You plan to sell on App Store later
- ✅ You want automatic updates

### Use Option 2 (Manual) if:
- ✅ You just want it working quickly
- ✅ You don't need the app infrastructure
- ✅ You're okay with manual updates

### Use Option 3 (Development App) if:
- ✅ You want to test the extension properly
- ✅ You're preparing for App Store
- ✅ You want the real experience

---

## Quick Start: Manual Installation (Fastest)

If you just want it working NOW:

1. **Copy this code** to `snippets/see-it-button.liquid`:

```liquid
{% liquid
  assign product_id = product.id | split: '/' | last
  assign variant_id = product.selected_or_first_available_variant.id | split: '/' | last
  assign product_title = product.title | escape
  assign app_url = 'https://your-app.vercel.app'  # UPDATE THIS!
  assign modal_url = app_url | append: '?productId=' | append: product_id | append: '&variantId=' | append: variant_id | append: '&productTitle=' | append: product_title
%}

<button onclick="window.open('{{ modal_url | escape }}', 'SeeIt', 'width=420,height=800,scrollbars=yes')" style="background: #000; color: #fff; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; margin: 20px 0;">
  See It In Your Home
</button>
```

2. **Add to product template**:
   - Theme Editor → Product template
   - Add snippet: `{% render 'see-it-button' %}`

3. **Update app URL** in the snippet

4. **Done!** ✅

---

## Need Help?

- **Shopify CLI docs**: https://shopify.dev/docs/apps/tools/cli
- **Theme extensions**: https://shopify.dev/docs/apps/online-store/theme-app-extensions
- **Manual snippets**: https://shopify.dev/docs/themes/liquid/reference/tags/render

Want me to help you set up a specific option? Let me know which one you prefer!
