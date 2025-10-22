# CYCLEBREAKER — Personalized Opportunity Finder (SA-first, PWA-first)

This repository contains the product/technical plan and initial schemas for CycleBreaker SA — a hyper-local, profile-driven opportunity matcher focused on grants, training, jobs, and services for low-income users in South Africa. The current approach is feasibility-first for a solo developer: PWA-only MVP, deterministic matching, curated sources, and minimal PII.

Core idea
- Provide high-quality, explainable, transport-aware recommendations matched to a user profile (location, skills, constraints, goals).
- Prioritize survival-first actions (jobs, grants, debt education) with clear checklists and official links. Avoid risky integrations and USSD for sensitive flows.

What's here now
- **docs/plan.md** — MVP plan, three prototypes, feasibility and risks, APIs/resources
- **docs/DELIVERABLES_52WEEK.md** — comprehensive 52-week full-stack plan with 6 modules, AI integration, and Firebase support
- **docs/roadmap.md** — MVP phases and detailed Week 1 activities
- **docs/architecture.md** — high-level system design and pipeline
- **docs/WEEK1_TASKS.md** — actionable Week 1 task breakdown with code examples
- docs/user-profile.md — profile fields and example JSON
- docs/eligibility-rules.md — JSON-rule DSL and examples
- docs/search-strategy.md — search/ingestion approach and ranking
- docs/sources.md — curated list of sources (SA-first, global later)
- docs/data-pipeline.md — ingestion, extraction, classification
- docs/security-privacy.md — PII handling, consent, retention
- docs/metrics.md — evaluation and product metrics
- .env.example — API key placeholders and config
- packages/shared/schema/userProfile.ts — typed schema
- packages/shared/schema/opportunity.ts — typed schema

APIs and resources (free-first)
- Official portals and zero-rated resources (link, don’t scrape dynamic):
  - SASSA Services (services.sassa.gov.za): grant info and how-to
  - SAYouth.mobi (sayouth.mobi): youth jobs/training (zero-rated)
  - Department of Labour ESSA (essa.labour.gov.za): job seeker portal
  - NGO content: Black Sash (legal aid), FunDza (literacy), JustMoney (financial education)
- Optional utilities: OpenStreetMap/Nominatim for geocoding; Google Maps (free tier) if needed

Planning approach
- **MVP-first** (docs/plan.md, docs/roadmap.md): 4-6 week rapid validation with PWA, deterministic rules, curated data
  - Prototype A (ship first): PWA-only, no USSD, deterministic rules, explainable matching, offline caching
  - Prototype B (later): Add SMS digest + USSD-lite (read-only public info) via partner
  - Prototype C (later): Agent/kiosk-assisted onboarding and verification with community partner
- **Full-scale vision** (docs/DELIVERABLES_52WEEK.md): 52-week plan with 6 modules, AI integration (NVIDIA), Firebase support
  - Phase 1 (Weeks 1-12): Core build with Jobs, Grants, Training
  - Phase 2 (Weeks 13-24): AI & matching enhancements, Money & Debt modules
  - Phase 3 (Weeks 25-36): Government Services & Health modules, SMS/USSD
  - Phase 4 (Weeks 37-48): Community features, multi-channel access, scalability
  - Phase 5 (Weeks 49-52): QA, launch, continuous improvement

**Approach**: Start with MVP (Weeks 1-12), validate with users, then incrementally add full-scale features based on feedback. Both plans share the same core mission and architecture.

Local development
- Requirements: Node 18+, npm
- Setup: npm install
- Env: cp .env.example .env and fill keys if you plan to use optional APIs
- Run both API and Web: npm run dev
  - API: http://localhost:4000 (POST /profiles, GET /feed, GET /opportunities/:id)
  - Web: http://localhost:3000 (Onboarding at /onboarding, Feed at /feed)
- Ingestion (stubs): npm run -w @cyclebreaker/ingestion ingest
  - Outputs JSON to packages/ingestion/data/ingested/

Week 1 objectives (see docs/WEEK1_TASKS.md for detailed breakdown)
- Finalize minimal profile and opportunity schemas (packages/shared/schema/)
- Implement JSON-logic evaluator and explainability mapping (packages/shared/src/eligibility.ts)
- Seed 20–40 curated SA opportunities (grants/training/jobs) with provenance and eligibility rules
- Implement GET /feed and basic PWA offline caching; onboarding form with validation
- Set up Windows-safe environment with cross-env for API key management

For full 52-week roadmap including AI integration, Health module, and Firebase support, see docs/DELIVERABLES_52WEEK.md.

Notes
- USSD is excluded from MVP due to security/spoofing risks and lack of secure session state. Any future USSD will be read-only and partner-delivered.
- Government form auto-submission is out of scope; CycleBreaker provides navigators and official links with checklists.
