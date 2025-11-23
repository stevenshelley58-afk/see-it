# Task List

## Phase 0: Foundations
- [x] Initial Setup & Architecture
- [x] Database Schema & Migrations
- [x] Basic Auth & Session Handling

## Phase 1: MVP (Composite Happy Path)
- [x] Admin Product List
- [x] Basic Theme Extension Modal
- [x] Product Prepare Endpoint
- [x] Render Endpoint

## Phase 2: Room Cleanup
- [x] Verify Room Cleanup Backend (`app-proxy.room.cleanup.ts`)
- [x] Verify Mask Upload UX (Frontend)

## Phase 3: Placement Enhancements
- [x] Verify Resize/Scale Controls in Theme Extension
- [x] Verify Retry Logic

## Phase 4: Batch Prep & Stale Handling
- [x] Verify Batch Prepare Endpoint (`api.products.batch-prepare.jsx`)
- [x] Verify Webhook Handler (`webhooks.products.update.jsx`)
- [x] Verify Admin Batch UI

## Phase 5: Billing & Quotas
- [x] Verify Billing Endpoints (`api.billing.jsx`)
- [x] Verify Quota Enforcement (`quota.server.js`)
- [x] Verify Usage Reporting in Admin

## Phase 6: Style Presets & Prompt Evolution
- [x] Implement Style Presets in Storefront (Modal & Button)
- [x] Backend captures stylePreset in render_jobs
- [x] Update Prompt Logic (Backend supports it)

## Phase 7: Advanced Enhancements
- [x] Analytics Dashboard (app.analytics.jsx)
- [x] Multi-Room Sessions (localStorage-based, frontend-only)

## Phase 8: Deployment & Handoff
- [x] Redeploy Railway Service ("See-It")
- [/] Run Production Migrations
- [ ] Verify Environment Variables
- [ ] Verify Image Service
- [ ] Local Verification & Dev Store Install
