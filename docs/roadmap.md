# Roadmap

Phase 1 — MVP (4–6 weeks)
- Week 1
  - Finalize minimal profile and opportunity schemas in packages/shared/schema.
  - Implement JSON-logic eligibility evaluator and explainability mapper in @cyclebreaker/shared.
  - Create curated SA dataset (20–40 opportunities) with provenance and eligibility rules.
  - API: GET /feed, GET /opportunities/:id, POST /profiles.
  - Web: Onboarding form (zod/react-hook-form), Feed page with save/hide, PWA offline caching.
- Week 2
  - Add transport-aware distance/penalty scoring (geohash or simple Haversine).
  - Build admin verify UI for provenance, last-verified, and expiry management.
  - Add savings calculators and debt SMS templates; grant navigator checklists.
- Week 3–4
  - Expand curated/static sources to 50–80 items; add dedup/freshness policies.
  - Accessibility baseline and language scaffolding; feedback signals and ranking tweaks.

Phase 2 — Beta (4–8 weeks)
- Expand sources (structured static pages a nd official portals); better ranking; feedback loop.
- Metrics dashboard; QA sampling; improved explainability and error handling.

Phase 3 — Partner features
- SMS digest (budget-dependent) and USSD-lite (read-only) via partner aggregator/MNO.
- Agent/kiosk onboarding mode with a community partner; verification badges.
- Partnerships with NGOs and departments; publish programmatic APIs later.
