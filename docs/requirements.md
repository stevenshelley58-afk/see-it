See It In Your Home — Requirements Brief
========================================

Overview
--------
- Purpose: Embed a modal experience on Shopify product pages enabling shoppers to visualize catalog items inside their own space using 2D photo compositing.
- Core Promise: “See how it looks” in the customer’s environment without technical jargon, delivering a realistic blended preview in under 15 seconds.

Primary Use Cases
-----------------
1. Shopper discovers a product on a Shopify PDP and wants confidence it fits their room aesthetics.
2. Shopper captures or uploads a room photo, positions the product, and receives a photorealistic composite to review and optionally email.
3. Merchant support agent reviews session analytics to understand usage and troubleshoot issues.

Key User Stories
----------------
- As a shopper, I can launch “See It In Your Home” from any eligible product page.
- As a shopper, I can quickly capture or upload a photo of my room, crop it, and place the product.
- As a shopper, I can adjust placement until satisfied and trigger a blended preview that respects lighting and shadows.
- As a shopper, I can revisit placement or exit back to the store at any time.
- As a shopper, I can email myself the generated previews from the session.
- As a merchant, I can configure the hero product image and generation prompt via Shopify metafields.
- As a merchant, I can review metrics on usage, generation success, and email opt-ins.

Success Metrics
---------------
- CTR on “See It In Your Home” CTA ≥ 12% of PDP sessions (merchant baseline configurable per store).
- Completion rate (preview generated ÷ launches) ≥ 70%.
- Median time from placement submit to preview display ≤ 12 seconds.
- Email opt-in on session close ≥ 25%.
- Error rate (failed generations ÷ submissions) ≤ 3% with automatic retry coverage.

Non-Goals
---------
- No 3D or AR rendering within the client.
- No persistence of user-uploaded photos beyond 30 days unless user consents via email opt-in.
- No complex editing tools (e.g., masking furniture) in v1.

Assumptions
-----------
- Products include high-quality PNGs with transparent backgrounds via metafields.
- Merchants authorize the app in Shopify to read product data and metafields.
- Vertex AI Gemini 2.5 Flash Image is available in chosen GCP region with required quota.

Constraints
-----------
- All copy must use simple, friendly language (no “AI,” “render,” or “compute”).
- Must comply with Shopify App Store policies and GDPR/CPRA for handling user imagery.
- Client must operate smoothly on modern mobile Safari and Chrome (iOS/Android 14+) and degrade gracefully on desktop.

Risks & Mitigations
-------------------
- **Slow uploads on cellular**: downscale client-side to ≤1024px before upload.
- **Generation failures**: implement retry with exponential backoff, surface friendly fallback message, and allow reattempt.
- **Privacy concerns**: provide clear consent and delete policy; limit storage duration via TTL lifecycle rules on GCS bucket.
- **Inconsistent prompts**: require merchants to QA prompts before publishing via admin checklist.

Decisions & Policies
--------------------
- CTA wording is controlled at the app level with per-store localization but no per-product override to keep messaging consistent with legal copy reviews.
- The email capture modal includes an unchecked consent checkbox with copy “Yes, send my previews to this email address,” which must be selected before the request is submitted.
- Session analytics and email delivery logs are retained for 90 days; user-uploaded photos and generated previews are purged automatically from GCS after 30 days unless the shopper opts in via email.

