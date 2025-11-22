# Prompts Specification

## Prompt Catalog

### `product_prep_v1`

- Identifier: `product_prep`.
- Purpose: cut out the product from a Shopify catalog image and return a transparent PNG suitable for ghost overlays and composites.
- Inputs: `source_image_url`, shop/product context, optional overrides; no mask required.
- Outputs: background-removed PNG saved to `product-prepared/...`.
- Notes: canonical prompt text lives in `/prompts/product_prep_v1.txt` (to be populated later).

### `product_crop_v1` (optional)

- Identifier: `product_crop`.
- Purpose: optional pre-crop or aspect-ratio normalization step; not required for MVP.
- Inputs/Outputs: mirrors `product_prep_v1` but can enforce tighter framing if adopted.
- Notes: placeholder for future optimization; keep identifier reserved.

### `product_prep_fallback_v1`

- Identifier: `product_prep_fallback`.
- Purpose: backup prompt when primary preparation fails or produces artifacts.
- Inputs/Outputs: same contract as `product_prep_v1`.
- Notes: triggered by backend retry logic; ensure logged separately for analytics.

### `room_cleanup_v1`

- Identifier: `room_cleanup`.
- Purpose: inpaint masked regions of the room image to remove furniture or clutter.
- Inputs: `room_image_url`, `mask_url`, contextual instructions.
- Outputs: cleaned room JPEG written to `room-cleaned/...`.
- Notes: stubbed in MVP; prompt text added when cleanup is implemented.

### `scene_composite_v1`

- Identifier: `scene_composite`.
- Purpose: place the prepared product into the room image according to placement coordinates and style preset.
- Inputs: prepared PNG, room image (original or cleaned), placement data, style preset hint.
- Outputs: composite JPEG saved to `composites/...`.
- Notes: prompt must honor placement and stylistic guidance; version changes require schema/log updates.

## Style Presets

### `style_neutral_v1`

- Default look for MVP; balanced lighting and realistic color fidelity.
- Applied when `config.style_preset` is omitted or set to `"neutral"`.

### `style_warm_v1`

- Emphasizes warm tones and cozy lighting; optional future preset.
- Should adjust prompt wording to bias towards warm ambient light.

### `style_crisp_v1`

- Targets bright, high-contrast scenes with cooler highlights.
- Useful for modern or minimalist catalog styles.

All presets are referenced by name in `config.style_preset` (app proxy) and `prompt.style_preset` (image service) and must align with prompt templates stored in `/prompts`.

