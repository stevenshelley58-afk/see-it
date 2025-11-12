# Theme App Extension Setup Guide

## Quick Start

### 1. Update App URL

Before deploying, update the default app URL in the extension:

**File**: `extensions/see-it-button/blocks/see-it-button.liquid`

Find this line:
```liquid
assign app_url = block.settings.app_url | default: 'https://see-it.vercel.app'
```

Change `https://see-it.vercel.app` to your actual deployed app URL.

### 2. Deploy Your App

When you deploy your app, the extension is automatically included.

**Using Shopify CLI:**
```bash
shopify app deploy
```

**Using Vercel/Other:**
Make sure your build includes the `extensions/` directory. Vercel should pick it up automatically.

### 3. Merchants Use It

After merchants install your app:

1. They go to **Online Store** → **Themes** → **Customize**
2. Navigate to a product page template
3. Click **Add block**
4. Find **"See It In Your Home"**
5. Drag it where they want it
6. Customize settings (optional)
7. Save

Done! ✅

---

## Testing Locally

### Option 1: Shopify CLI (Recommended)

```bash
# Install Shopify CLI if you haven't
npm install -g @shopify/cli @shopify/theme

# Start development server
shopify app dev

# This will:
# - Start your app locally
# - Make extensions available
# - Allow testing on a development store
```

### Option 2: Deploy to Development Store

1. Deploy your app to staging/preview environment
2. Install on a development store
3. Test the extension in Theme Editor

---

## Customization Options

Merchants can customize the button through Theme Editor:

### Button Text
- Default: "See It In Your Home"
- Can be changed to anything

### Button Style
- **Primary**: Black button with white text
- **Secondary**: White button with black border
- **Outline**: Transparent with black border

### Button Size
- **Small**: Compact button
- **Medium**: Standard size (default)
- **Large**: Prominent button

### Alignment
- **Left**: Aligns button to the left
- **Center**: Centers button (default)
- **Right**: Aligns button to the right

---

## How It Works

### What Gets Passed to Your App

When the button is clicked, it opens your app with these query parameters:

```
https://your-app.com?
  productId=123456789
  &variantId=987654321
  &productTitle=Modern%20Armchair
  &locale=en
  &shop=mystore.myshopify.com
```

Your app's `page.tsx` reads these from `window.location.search` and uses them to:
- Load product data
- Show correct product image
- Set up the preview session

### Popup Window

The button opens your app in a popup window:
- Width: 420px
- Height: 800px
- Centered on screen
- Scrollable and resizable

---

## Troubleshooting

### Button Doesn't Appear

**Check:**
- [ ] Extension is deployed with your app
- [ ] App is installed on the store
- [ ] You're on a product page template (not homepage, etc.)

### Modal Doesn't Open

**Check:**
- [ ] App URL is correct in block settings
- [ ] App is accessible (not blocked by CORS)
- [ ] Browser allows popups

### Wrong Product Data

**Check:**
- [ ] Product ID is being passed correctly
- [ ] Your app reads query parameters correctly
- [ ] Metafields are set up for the product

---

## Updating the Extension

### After Making Changes

1. Update the extension files
2. Deploy your app
3. Extension updates automatically
4. Merchants don't need to do anything

### Breaking Changes

If you make breaking changes:
- Consider versioning your extension
- Provide migration guide
- Test with existing merchants

---

## Best Practices

### 1. Default Settings

Set sensible defaults:
- Button text should be clear
- Primary style works for most themes
- Center alignment is usually best

### 2. Responsive Design

The CSS includes mobile styles. Test on:
- Desktop
- Tablet
- Mobile

### 3. Theme Compatibility

The extension works with:
- ✅ Online Store 2.0 themes
- ✅ Most custom themes
- ⚠️ Older themes (may need adjustments)

### 4. Performance

- CSS is minimal and fast
- No external dependencies
- Popup doesn't block page load

---

## Next Steps

1. **Test locally** with Shopify CLI
2. **Deploy** to your staging environment
3. **Test** on a development store
4. **Iterate** based on feedback
5. **Deploy** to production

---

## Support

If merchants have issues:

1. Check extension is added to product template
2. Verify app URL is correct
3. Check browser console for errors
4. Ensure app is installed and active

For development issues, see the main README or docs.
