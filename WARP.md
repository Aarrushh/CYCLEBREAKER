# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Common commands and environment
- Requirements
  - Node >= 18.17
  - npm workspaces monorepo: apps/* and packages/*; root scripts orchestrate sub-workspaces.
- Install
  - npm install
- Develop
  - All apps (API + Web): npm run dev
    - Web: http://localhost:3000
    - API: http://localhost:4000
  - Per app: npm run dev:api, npm run dev:web
- Build (topologically ordered)
  - npm run build
  - Order: packages/shared → packages/ingestion → apps/api → apps/web
- Typecheck (workspace-wide)
  - npm run typecheck
- Ingestion CLI
  - Run: npm -w @cyclebreaker/ingestion run ingest [ZA [locality]]
  - Output: packages/ingestion/data/ingested/
  - Curated dataset used by API: packages/ingestion/data/curated/sa_opportunities.json
  - Env (optional): DEEPSEEK_API_KEY, PARALLEL_API_KEY
- Lint
  - Not configured; root script exists but workspaces have no lint configs/scripts yet.
- Tests
  - Not configured; npm test will no-op/fail. Single-test invocation does not exist yet.
- Environment variables
  - API
    - PORT (default 4000); listens on 0.0.0.0; dotenv supported; CORS enabled
    - DEEPSEEK_API_KEY, DEEPSEEK_API_BASE, DEEPSEEK_MODEL used by apps/api/src/clients/deepseek.ts for optional AI profile suggestion
  - Web
    - NEXT_PUBLIC_API_BASE (default http://localhost:4000), used by /onboarding and /feed pages
  - Ingestion
    - DEEPSEEK_API_KEY and PARALLEL_API_KEY are checked (optional)

Architecture overview
- Monorepo and tooling
  - All packages are ESM (module: NodeNext). tsconfig.base.json defines path aliases (e.g., @cyclebreaker/shared). No database; persistence is in-memory for the MVP.
- packages/shared (TypeScript library)
  - Zod schemas: UserProfile, Opportunity
  - Matching: evaluateRule (JSON-logic-like), explainMatch, calculateMatchScore
  - ESM exports consumed via path aliases across API/Web
- apps/api (Fastify, ESM)
  - State: in-memory Map for profiles
  - Data source: packages/ingestion/data/curated/sa_opportunities.json
  - Endpoints:
    - POST /profiles — validates with shared schema; generates id
    - GET /feed?profile_id=… — filters curated opportunities via shared evaluator; returns MatchResult[] sorted by score
    - GET /opportunities/:id — returns a single curated opportunity
  - Server: listens on 0.0.0.0 at PORT (default 4000); CORS and dotenv enabled
  - AI-assisted onboarding: /profiles/sort expected by Web is scaffolded in apps/api/src/services/profile_suggest.ts but not mounted in server.ts; requires DEEPSEEK_API_KEY to enable
- apps/web (Next.js 14 App Router, ESM)
  - Pages: /onboarding and /feed
  - Calls API via NEXT_PUBLIC_API_BASE (defaults to http://localhost:4000)
- packages/ingestion (CLI + sources)
  - Adapters for curated/static seeds (SASSA/NSFAS/municipal/jobs via cheerio/undici) and optional breadth search hooks (Parallel + DeepSeek placeholders)
  - Writes ingested JSON under packages/ingestion/data/ingested/
  - Curated dataset for the MVP lives at packages/ingestion/data/curated/sa_opportunities.json and is what the API serves
- Known gaps
  - Lint/Test: not configured across workspaces; root scripts exist but no per-workspace configs/runners
  - AI onboarding route is not wired; to enable, mount profile_suggest in Fastify and set DEEPSEEK_API_KEY (optionally DEEPSEEK_API_BASE, DEEPSEEK_MODEL)
