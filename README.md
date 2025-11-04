# CYCLEBREAKER — Simple, explainable opportunity finder (SA-first)

CycleBreaker helps people in South Africa find relevant grants, jobs, and training using a lightweight PWA and simple, explainable matching. MVP is privacy-first (minimal PII), deterministic, and fast to run on low-end devices.

## Quick start
1) Install Node 18+ and npm
2) Install deps: `npm install`
3) (Optional) create `.env` or set secrets as user-level env vars (recommended on Windows):
   - PowerShell (run once per user):
     - `[Environment]::SetEnvironmentVariable('CB_SECRET_DEEPSEEK_API_KEY','{{DEEPSEEK_API_KEY}}','User')`
     - `[Environment]::SetEnvironmentVariable('CB_SECRET_NVIDIA_API_KEY','{{NVIDIA_API_KEY}}','User')`
     - `[Environment]::SetEnvironmentVariable('CB_SECRET_UNLIMITED_API_KEY','{{UNLIMITED_API_KEY}}','User')`
4) Run both API and Web: `npm run dev`
   - API: http://localhost:4000 (POST /profiles, GET /feed, GET /opportunities/:id)
   - Web: http://localhost:3000 (onboarding at /onboarding, feed at /feed)

## Simple app design (at a glance)
- PWA client (apps/web) collects a small profile and shows a feed
- API (apps/api) validates profile, runs rule-based eligibility, returns matches
- Matching is deterministic via JSON-like rules in `packages/shared/src/eligibility.ts`
- Data is curated (no heavy scraping); stored as JSON in `packages/ingestion`
- Offline-first PWA caching; minimal PII; no USSD in MVP (read-only later via partner)

Flow:
```
User (PWA) → API (Fastify) → Rule matcher → Curated opportunities JSON → Personalized feed
```

## Repository layout
- apps/api — Fastify API (TypeScript)
- apps/web — PWA frontend
- packages/shared — shared types, schemas, and eligibility logic
- packages/ingestion — stubs and scripts for curated data ingestion
- docs — plans, architecture, roadmap, and references
- scripts, config — utilities and prompt/config files

## Development
- Common scripts:
  - `npm run dev` — start API + Web
  - `npm run build` — build all workspaces
  - `npm run lint` — lint all packages
  - `npm run typecheck` — TypeScript type checks
  - `npm run -w @cyclebreaker/ingestion ingest` — write JSON to `packages/ingestion/data/ingested/`
- Code style: keep things small, explicit, and explainable; prefer typed schemas and pure functions.

## API (MVP)
- POST `/profiles` — accepts a minimal profile
- GET `/feed` — returns opportunities filtered and ranked for the profile
- GET `/opportunities/:id` — fetch a single item with an explanation

## MVP scope and safety
- Focus: jobs, grants, training with clear checklists and official links
- No government form auto-submission; no sensitive flows over USSD
- Keep secrets out of the repo; prefer user-level env vars and indirection

## Roadmap & deep dives
See `docs/plan.md`, `docs/roadmap.md`, `docs/architecture.md`, and `docs/DELIVERABLES_52WEEK.md` for the full plan, design trade-offs, and future modules.
