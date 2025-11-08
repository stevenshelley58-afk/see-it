Shopify Integration Notes
=========================

CTA Placement
-------------
- Insert a `See It In Your Home` button in the product template (Online Store 2.0 section or headless storefront).
- Button triggers the modal by invoking the embedded Next.js app, passing:
  - `productId`
  - `productImageUrl` (from metafield or product media)
  - `productTitle`
- Payload may optionally include `variantId` and `locale` when available.
- Integration supports theme app extensions for standard storefronts and script embed for headless.

Metafields
----------
- Namespace: `custom`
- Keys:
  - `see_it_image` (File reference, expected PNG with transparency)
  - `see_it_prompt` (Single-line text)
- Validation: enforce max prompt length (e.g., 500 chars) and require file type `image/png`.

App Bridge Communication
------------------------
- Modal launched via Shopify App Bridge to respect storefront sandboxing.
- App listens for `close` event to exit gracefully (e.g., when shopper taps native close icon).
- Provide store locale to support translated copy.
- Fire events back to storefront when session completes (`see-it-in-your-home:preview-generated`) for merchant analytics hooks.

Authentication
--------------
- Use Shopify session token to authenticate requests from storefront to Vercel server functions.
- Server verifies JWT with Shopify public keys before issuing signed upload URLs or session creation.
- Signed upload URL endpoint returns 403 if token invalid, expired, or missing `read_products`.

Variant Handling
----------------
- When product has multiple variants, the CTA passes variant-specific image and identifier if available.
- Backend stores `productId` and optional `variantId` in Firestore session for analytics.

Installation Checklist
----------------------
1. Install app and grant scopes: `read_products`, `read_product_listings`, `write_customers` (for email send consent), `read_assigned_fulfillment_orders` (optional future).
2. Add CTA section block to product page via Theme Editor.
3. Populate `see_it_image` and `see_it_prompt` metafields for each product.
4. Test modal launch on staging storefront.
5. Enable Postmark Sender Signature for store domain.

