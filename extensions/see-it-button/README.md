# See It Button - Theme App Extension

This theme app extension adds a "See It In Your Home" button to product pages.

## What It Does

When merchants add this block to their product page template, it displays a button that opens the See It modal in a popup window, allowing customers to visualize products in their own space.

## Installation

This extension is automatically included when merchants install your app. They can then:

1. Go to **Online Store** → **Themes** → **Customize**
2. Navigate to a product page template
3. Click **Add block**
4. Find **"See It In Your Home"** in the list
5. Drag it to the desired location
6. Customize settings (button text, style, size, alignment)

## Configuration

Merchants can customize:

- **Button Text**: Default is "See It In Your Home"
- **App URL**: Your deployed app URL (defaults to `https://see-it.vercel.app`)
- **Button Style**: Primary (black), Secondary (white), or Outline
- **Button Size**: Small, Medium, or Large
- **Alignment**: Left, Center, or Right

## Files

- `shopify.extension.toml` - Extension configuration
- `blocks/see-it-button.liquid` - The button block code
- `assets/see-it-button.css` - Button styling

## Development

### Testing Locally

1. Use Shopify CLI to test the extension:
   ```bash
   shopify app dev
   ```

2. Or deploy and test on a development store

### Updating the Extension

After making changes:

1. Deploy your app
2. The extension updates automatically
3. Merchants don't need to do anything

## Customization

Merchants can customize the button through the Theme Editor settings. The extension passes:

- `productId` - Current product ID
- `variantId` - Selected variant ID
- `productTitle` - Product title
- `locale` - Store locale
- `shop` - Shop domain

All parameters are passed to your app URL as query parameters.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Dark mode support (if theme supports it)

## Notes

- The button opens the modal in a popup window (420x800px)
- Analytics events are tracked if `window.dataLayer` is available
- The extension only appears on product pages (`available_if: product`)
