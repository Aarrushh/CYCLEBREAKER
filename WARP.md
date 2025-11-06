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
    - NVIDIA_API_KEY, NVIDIA_API_BASE_URL, NVIDIA_MODEL for scam detection endpoint
    - DEEPSEEK_API_KEY, DEEPSEEK_API_BASE, DEEPSEEK_MODEL for AI onboarding (/profiles/sort)
    - OPENAI_COMPAT_API_KEY, OPENAI_COMPAT_BASE_URL (optional OpenAI-compatible provider; e.g., Lao Zhang)
    - UNLIMITED_API_KEY(S), UNLIMITED_API_BASE_URL (optional OpenAI-compatible provider used by unlimited client)
  - Web
    - NEXT_PUBLIC_API_BASE (set to deployed API URL in production). If unset, feed and onboarding have offline fallbacks for demo
  - Ingestion
    - DEEPSEEK_API_KEY and/or OPENAI_COMPAT_API_KEY; PARALLEL_API_KEY, PARALLEL_BASE_URL (optional)

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
    - POST /profiles — minimal create; returns id
    - GET /feed?profile_id=… — returns curated opportunities with freshness-based score
    - POST /api/match — transport-aware ranking via @cyclebreaker/shared
    - POST /api/ai/analyze-posting — scam detection via NVIDIA (env-gated)
    - POST /profiles/sort — AI-assisted profile suggestion via DeepSeek/OpenAI-compat (env-gated)
  - Server: listens on 0.0.0.0 at PORT (default 4000); CORS and dotenv enabled
- apps/web (Next.js App Router)
  - Pages: /onboarding and /feed
  - Uses NEXT_PUBLIC_API_BASE in production; if unset, falls back to static curated dataset and local profile id for demo
- packages/ingestion (CLI + sources)
  - Adapters for curated/static seeds (SASSA/NSFAS/municipal/jobs via cheerio/undici) and optional breadth search hooks (Parallel + DeepSeek placeholders)
  - Writes ingested JSON under packages/ingestion/data/ingested/
  - Curated dataset for the MVP lives at packages/ingestion/data/curated/sa_opportunities.json and is what the API serves
- Known gaps
  - Lint/Test: not configured across workspaces; root scripts exist but no per-workspace configs/runners
  - AI onboarding route is not wired; to enable, mount profile_suggest in Fastify and set DEEPSEEK_API_KEY (optionally DEEPSEEK_API_BASE, DEEPSEEK_MODEL)
