# Offline-First Architecture for Low-Data Environments

Goals
- Work on low-end Android devices, intermittent connectivity, and little to no user-paid data.
- Preserve privacy and safety; prevent data loss; keep the app useful offline.

Client
- PWA with service worker caching and background sync.
- IndexedDB with AES-GCM encryption for sensitive records (keys derived from device + passcode).
- Language packs: bundle English, add Zulu/Xhosa/Afrikaans as downloadable packs.
- Vector map tiles (low-zoom), offline geocoding via pre-indexed POIs (clinics, NGOs, municipal offices).
- Minimal payload: text-first content; defer images; compress aggressively.

Sync model
- Opportunistic sync on Wi‑Fi or free data (zero-rated). Retry with exponential backoff.
- Conflict policy: last-write-wins for non-sensitive lists; server authoritative for curated datasets.
- Staleness markers: show “last verified X days ago” and confidence levels on volatile data (prices, queue times).

Backend
- API endpoints optimized for small payloads: gzip/brotli; field selection; delta sync.
- Job queue for crawlers and freshness checks (Redis-backed).
- CDN edge caching for region packs and static content (Cloudflare/Netlify).

Security
- Device-level passcode to unlock profile; optional biometric if supported.
- Never send PII to third-party LLMs; redact logs; rotate tokens; strict CORS.

Testing
- Throttle network in CI; simulate 2G/Edge; test offline flows and resync recovery.

