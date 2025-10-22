# API (Placeholder)

This folder will contain the backend API (Fastify or FastAPI). For now, see shared schemas in packages/shared/schema and the architecture docs for endpoints.

Proposed endpoints (MVP)
- POST /profiles — create/update user profile
- GET /feed?profileId= — personalized opportunities
- POST /feedback — save/hide/dismiss feedback
- POST /ingest/search — trigger on-demand search for a profile/intent
- POST /ingest/reindex — refresh a source/domain

