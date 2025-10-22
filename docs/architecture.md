# Architecture

Components
- Web App (Next.js/React): onboarding, profile management, personalized feed, explainability, saves, notifications.
- API (Node.js + Fastify or Python + FastAPI): auth, profile CRUD, matching, feed, ingestion control.
- Search/Discovery Service:
  - On-demand search via Parallel API using query templates.
  - Scheduled crawlers/adapters per source (official APIs preferred; web HTML as fallback).
  - Link expansion with depth limits; robots.txt and rate limiting respected.
- Extraction/Structuring:
  - Clean HTML, parse metadata, detect language.
  - DeepSeek to extract structured fields: title, amount, type, deadlines, location, eligibility bullets, required docs, apply link.
  - Simhash/shingling for de-duplication.
- Classification & Eligibility:
  - Category + region classification via DeepSeek.
  - Eligibility DSL evaluation against user profile.
  - Explanations composed from matched rules + model summarization.
- Data Store:
  - PostgreSQL (with pgvector) for canonical entities.
  - Optional: Meilisearch/Elasticsearch for fast text/faceted search.
  - Redis for caching and job coordination.
- Jobs/Queue:
  - BullMQ (Node) or RQ/Celery (Python) for ingestion, refresh, and scoring jobs.
- Observability:
  - Structured logs, request tracing, job metrics; PII scrubbing.

Data Flow (simplified)
1) Query generation: DeepSeek expands profile into search intents and site-specific query templates.
2) Search breadth: Parallel fetches top N URLs per site and general web.
3) Fetch + extract: HTML→text, metadata parse; language detect; canonicalize URLs.
4) Classify + structure: DeepSeek transforms text → Opportunity JSON; compute simhash; dedup.
5) Evaluate eligibility: rule DSL vs user profile; compute match_score and why_matched.
6) Store: Upsert normalized Opportunity; link to Source and Organization; index.
7) Serve feed: rank by match_score, freshness, quality, user feedback.

Security & Privacy (see docs/security-privacy.md)
- PII minimization, consent, retention limits, encryption at rest and in transit, role-based access.

Key Design Choices
- Eligibility as rules + model assistance for extraction.
- Source adapters are modular: each site has fetch, parse, validate, map, and ToS notes.
- Explainability is first-class: show users why a match appears and how to act.

