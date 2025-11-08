Launch Checklist
================

Preflight
---------
- [ ] Verify Shopify app listing copy, screenshots, and pricing.
- [ ] Confirm metafields populated for top 20 products.
- [ ] Ensure Postmark sender signature approved and template tested.
- [ ] Lock production environment variables (GCP, Vercel, Shopify secrets).
- [ ] Legal/privacy sign-off on email consent copy and retention windows.

Technical
---------
- [ ] Cloud Run min instances set to 1 with concurrency 4; autoscaling max 20.
- [ ] Bucket lifecycle rule enabled (30-day delete) and CDN cache invalidation script ready.
- [ ] Alert policies active for 5xx rate, latency, and Vertex quota.
- [ ] Backup plan documented for Vertex outage (fallback to mock preview message).
- [ ] Confirm `NEXT_PUBLIC_USE_MOCKS` is disabled in production deploy.

Operational
-----------
- [ ] Support playbook published with troubleshooting steps and FAQ.
- [ ] Team on-call rotation scheduled for launch week.
- [ ] Analytics dashboard (Looker Studio) shared with stakeholders.
- [ ] Post-launch survey form prepared for merchants.
- [ ] Privacy policy updated to mention 30-day photo retention and email fulfillment.

Rollout
-------
- [ ] Enable feature for internal store first, monitor 24h.
- [ ] Gradually roll out to 10% of traffic, then 50%, then 100%.
- [ ] Conduct retro after week one and capture backlog items.

