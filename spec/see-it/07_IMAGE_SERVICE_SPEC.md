# Image Service Specification

## Responsibilities

### `POST /product/prepare`

- Input: source Shopify product image URL, target storage URL, prompt/model metadata, shop/product context.
- Output: transparent PNG written to `product-prepared/{shop_id}/{product_id}/{asset_id}.png`.
- Must return the final URL and ensure the PNG contains only the isolated product (no background).
- Called during merchant asset prep via backend worker.

### `POST /room/cleanup`

- Input: original room image URL, mask URL, prompt/model metadata.
- Output: cleaned room image written to `room-cleaned/{shop_id}/{room_session_id}/{uuid}.jpg`.
- MVP can stub by returning the original room image URL; later phases must inpaint masked regions.
- Triggered when shoppers use erase tools; otherwise skipped.

### `POST /scene/composite`

- Input: prepared product PNG, chosen room image (original or cleaned), placement (x, y, scale), prompt/model metadata including style preset.
- Output: composite JPEG stored at `composites/{shop_id}/{render_job_id}.jpg`.
- Invocation occurs after `/app-proxy/render`; response drives job completion in the Shopify app.
- Must honor placement coordinates (normalized 0–1) and produce photorealistic output.

## Prompt Usage

- Prompts referenced by `prompt.id` and `prompt.version` must match entries in `08_PROMPTS_SPEC.md`.
- `product_prep_v1`, `room_cleanup_v1`, and `scene_composite_v1` are required for MVP; fallback and crop variants are available as future options.
- Style presets (e.g., `style_neutral_v1`, `style_warm_v1`, `style_crisp_v1`) inform the composite prompt and should map directly to prompt templates.

## Model Configuration

- Default model: `gemini-3-pro-image`.
- Accept optional `resolution` (e.g., `standard`) and `overrides` for advanced tuning (lighting direction, shadow intensity, etc.).
- Model selection may change across phases but must remain compatible with logged metadata and prompt assumptions.

## Logging Requirements

- Record `model_id`, `prompt_id`, and `prompt_version` for every request.
- Log the inbound request identifier (`render_job.id`, `product_asset.id`, or generated trace id).
- Surface failures with clear codes/messages so the Shopify app can populate `render_jobs.error_code` and `error_message`.
- Provide usage metrics (e.g., token counts) when available to support quota tracking.

