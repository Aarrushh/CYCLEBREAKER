# Final Plan — CycleBreaker SA (Feasibility-first)

> [!IMPORTANT]
> This document is now **SUPERSEDED** by [RPO_PLAN.md](RPO_PLAN.md) which details the new Hybrid AI (Local + Server) architecture.
> The content below is retained for domain context and feature ideas but the architecture (PWA-only, deterministic) is no longer the primary direction.

## Legacy Plan Content Below


Vision
- Deliver explainable, transport-aware, profile-matched opportunities (grants, training, jobs, services) for low-income users in South Africa. Survival-first, trust-centric, and low-data by design.

Guiding constraints
- Connectivity cost and reliability; USSD security/spoofing risks; government integration difficulty; hyper-local data volatility; privacy and legal risk.

MVP principles
- PWA-first; deterministic rules; curated/official sources; explainability; minimal PII; link to official portals rather than automate sensitive submissions.

Users & personas (SA-first)
- Unemployed/underemployed youth; caregivers on SASSA grants; informal workers; learners seeking TVET/SETA pathways.

Modules (MVP scope and beyond)
- Jobs: transport-conscious listings, no-experience filters, digital CV/checklists, zero-rated linkouts (SAYouth.mobi, Dept of Labour).
- Grants: eligibility highlights, means-test calculators, document checklists, navigators mirroring SASSA portal flows, NGO legal aid linkouts.
- Training/Skills: curated TVET/SETA programs; foundational digital literacy (Khan Academy links); vernacular content (FunDza links).
- Savings/Debt: calculators and educational content; stokvel planners; negotiation SMS templates; scam warnings; no regulated advice.
- Health (later): clinic wayfinding and heuristics only; no medical advice; official links.

System design at a glance
- Web PWA (Next.js). API (Fastify). Store (SQLite/PG). Ingestion (adapters: manual_curated | static_html | api). Eligibility evaluation (JSON-logic). Explainability (matched clauses + evidence links). Offline caching of profile, saved items, and checklists.

Risk and mitigation matrix (high level)
- USSD insecurity: exclude from MVP; later USSD-lite read-only via partner; never handle PII over USSD.
- Government integration complexity: “guide, not automate”; surface official pages; show policy version/last-checked.
- Hyper-local drift: provenance labels; last-verified timestamps; aggressive expiry; agent verification.
- Legal/privacy: minimal PII; consent gates; on-device storage; disclaimers for finance/health.
- Data quality: prefer official/zero-rated sources; structured parsers for static pages; avoid JS-heavy scraping; dedup and freshness checks.

Three implementation prototypes
- Prototype A (ship first): PWA-only, deterministic matching, curated datasets, offline caching, no USSD or sensitive integrations.
- Prototype B (later): Add SMS digest + USSD-lite (read-only public info counts and dates). Requires partner aggregator/MNO; no profile reads/writes via USSD.
- Prototype C (later): Agent/kiosk-assisted onboarding and verification at community partners (spaza/church/youth center). Offline-first kiosk mode.

Profile schema (minimal MVP)
- location: country_code, province_code, municipality, postal_code?, geohash?
- demographics: age_bracket, citizenship_status, disability_status?
- economic: employment_status, income_bracket, dependents_count
- education_skills: highest_education_level, skills[], certifications[]
- constraints: transport_mode, max_commute_km, internet_access, device_type, time_availability_hours_per_week
- goals: primary_goal, preferred_categories[], language_prefs[]
- consent: terms_accepted_at, consent_data_processing, retention_days?, share_anonymized?

Opportunity schema (MVP)
- id, title, category (job/training/grant/service), organization, regions[], value_amount/currency?, deadline?, required_documents[], eligibility_rules[], source_url, apply_url?, provenance(extraction_method, evidence_links[], last_seen_at, last_verified_at, freshness_score?)

Eligibility rule DSL
- JSON-logic operators: all/any/not/eq/ne/lt/lte/gt/gte/in/contains/exists/missing. Variables via "var" path into profile.

Matching and ranking (deterministic)
- Eligibility boolean via rules; score composed of source_quality, freshness decay, goal/category prior, distance/transport penalties, skills overlap.
- Explainability: render matched clauses with references to profile fields and evidence links; show disqualifiers separately.

APIs and resources to use (free-first)
- Government/official: services.sassa.gov.za (How-To, Grant Info), essa.labour.gov.za, provincial/municipal program pages.
- Zero-rated linkouts: sayouth.mobi (do not scrape dynamic views; provide links and call center number).
- Education/financial literacy: Khan Academy (courses), FunDza (vernacular literacy), Black Sash (legal aid), JustMoney (financial education).
- Utilities: OpenStreetMap/Nominatim geocoding; Google Maps free tier if required; date-fns; cheerio for static HTML parsing (honor robots.txt).

Roadmap (phases overview)
- Phase 1 (MVP, 4–6 weeks): finalize schemas; implement evaluator; curated datasets; feed with explainability; onboarding; offline PWA; admin verification.
- Phase 2 (Beta, 4–8 weeks): expand sources; transport-aware scoring; savings/debt calculators; feedback loop; accessibility and language scaffolding.
- Phase 3 (Partner features): SMS digest; USSD-lite via partner; agent/kiosk mode; metrics and QA processes; partnerships.

KPIs (MVP)
- Coverage: 20–50 active, verified SA opportunities with rules and documents.
- Quality: 100% with provenance and “last verified”; zero broken links; extraction precision high for curated/static sources.
- Engagement: profile completion >80%; feed CTR >15%; positive feedback rate trend up.

Week 1 activities (see docs/roadmap.md for task list)
- Finalize schemas; implement JSON-logic evaluator; write explainability mapper.
- Seed 20–40 curated items with provenance and rules (grants/training/jobs).
- Implement GET /feed and onboarding; basic PWA offline caching; start admin verify UI.
