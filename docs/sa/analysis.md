# CycleBreaker SA — Deep Analysis and Plan

This document digests the PDF you shared and turns it into a concrete, risk-aware execution plan. It keeps your original vision (six poverty pillars; hyper-local; one-tap actions; offline) and addresses the real-world constraints Kassa raised (USSD security, gov integration, volatile local data, ops/partnerships).

Summary of the PDF
- Purpose: A hyper-local, action-first app for low-income South Africans to break poverty cycles.
- Six modules: Jobs, Skills, Savings, Grants, Health, Debt.
- Core features: Cycle Breaker Score; urgency alerts; township-specific pricing; community-verified maps; one-tap actions (apply now, directions, lock savings); offline/USSD fallback.
- Kassa’s letter — critical constraints:
  - USSD is insecure (no E2EE, weak auth, spoofable codes, no session storage), risky for PII and financial/health tasks.
  - Government integrations (SASSA, NSFAS, SETA) are bureaucratically hard and costly.
  - Local pricing and transport rates are fluid; trust models and continual updates required.
  - Need for local ambassadors, telecom partnerships, audits; college-student bandwidth and financial constraints.

Strategic stance
- Preserve the product vision but de-risk launch: achieve value without (1) heavy gov integrations, (2) USSD dependence, or (3) brittle live-local data promises we can’t maintain yet.
- Aim for an offline-first PWA + WhatsApp channel; treat USSD as a limited “directory and callback” tool only.
- Build a curated knowledge base of official resources and high-signal opportunities; add community data with moderation and proof-of-freshness.

MVP scope (SA-first)
- Personas: individuals in townships; optional small-trader microbusinesses (spaza, hair, repairs).
- Categories: grants/benefits (SASSA info), training/programs (SETA/TVET), health services navigation, debt literacy + scripts, local aid (soup kitchens, clinics), ultra-light jobs (community listings + reputable apps).
- Channels: offline-first PWA; WhatsApp Business; (optional) USSD for non-PII menu + request-a-call.

Risk mitigation mapping
1) USSD security
- Policy: No PII collection or sensitive actions via USSD. Limit to read-only info + callback requests.
- Authentication: Verify users via SMS OTP inside PWA/WhatsApp; tie to device fingerprint where possible.
- Anti-scam posture: publish official short codes; in-app “Verify code” checker; education screens; report-scam CTA.
- Alternatives: WhatsApp Business (E2EE, better UX) and offline PWA that caches flows.

2) Government integrations
- Replace live integrations with auto-filled printable forms + step checklists.
- Track status pages and known deadlines (scraped from official sites where ToS allows).
- Build relationships over time; start with NGO partners who already interface with SASSA/NSFAS/SETA.

3) Local price and transport volatility
- Represent ranges + confidence scores, not single numbers. “Taxi fare (R12–R18), last verified 4 days ago.”
- Crowdsourcing with local ambassadors; sampling and random spot checks; reputation for contributors.
- Prefer durable facts (locations, hours) over volatile pricing in v1; add price ranges incrementally.

4) Operations and partnerships
- Zero-rating: pursue reverse-billed data with MNOs (Vodacom/MTN/Telkom/Cell C) so app usage is free for users.
- Local ambassadors: recruit via NGOs/TVETs; incentivize via airtime vouchers; training + moderation tools.
- Audit trail: immutable logs for edits to community data; periodic reviews; flagged content queue.

Product design from the PDF (concretized)
- Jobs module
  - “Walkable gigs” feed: 0–3 km radius; show walking time; offline map tiles. Initial supply from community boards + trusted apps (SweepSouth, Job Jack, SA Youth Mobi) with deep links.
  - No-experience filter; “start today” tag; SMS-ready employer scripts (“Hello, I live nearby and can start today”).
  - Transport-aware sort: cheaper-to-reach first.
- Skills module
  - Skills Gap Analyzer: quick quiz → target micro-credentials (digital literacy, basic bookkeeping, caregiver certs).
  - Pathways: sequences mapped to actual local job titles and wage uplift; include TVET dates and SETA learnerships.
  - Auto-fill forms: collect data once; export to PDF/WhatsApp for submission; store locally encrypted.
- Savings module
  - Crisis budget wizard: pre-baked templates (child in school, chronic medication, debt triage).
  - Actionable savings: “walk twice weekly → save R48 on taxis”; “buy bulk maize at Shoprite — current promo.”
  - Subsidy finder: scripted flows for Lifeline electricity/water discounts; auto-generate USSD/SMS snippets without sending PII.
- Grants module
  - Grant optimizer: highlight likely gaps (disability top-up, SRD R370, child support).
  - Payment tracker: surface official SASSA calendars; push local reminders (offline-capable).
  - Crisis support: soup kitchens, clinics, shelters with hours/contact; “open now” filters.
- Health module
  - Clinic navigator: community-sourced queue times + stock availability as “reported X mins ago.”
  - Preventive ROI nudges: cheap interventions with modeled savings; batch into weekly “health plan.”
  - Emergency protocols: pharmacy finder; offline first-aid checklists; USSD/SMS emergency numbers.
- Debt module
  - Debt triage: explain interest math; prioritize high-interest loans; show “time to freedom.”
  - Negotiation scripts: SMS/WhatsApp templates; printable letters.
  - Loan shark alerts: privacy-safe reporting; escalate patterns to moderators.

Architecture (SA-focused)
- Client
  - Offline-first PWA (React/Next + service worker). Local encrypted storage (IndexedDB + crypto). Low-bandwidth mode by default.
  - WhatsApp bot for common flows (eligibility checks, directions, reminders). No PII to LLMs; minimal data sent.
  - Optional USSD: read-only menus (lists of clinics, soup kitchens, how-to steps) + “call me back” capture via carrier brokering.
- Backend
  - PostgreSQL + Redis (jobs/queues). Optional Meilisearch for local text search.
  - Content pipeline: curated sources + community submissions; moderation queue; freshness checks.
  - Region packs: ship “SA pack” config (languages: Zulu, Xhosa, Afrikaans, Sotho, English; currency: ZAR; sources: SASSA/NSFAS/SETA/TVET/municipal).
- AI usage (DeepSeek + Parallel)
  - Parallel: targeted searches (site:sassa.gov.za, site:gov.za, site:nsfas.org.za, site:deptoflabour.gov.za, municipal domains, SA Youth Mobi) and general queries.
  - DeepSeek: extract structured fields (eligibility, deadlines, docs), generate rule JSON, summarize “why this matters.”
  - Safety: strip PII before sending; only send source text; strict prompts; caching summaries.
- Observability
  - PII-scrubbed logs; metrics on freshness, coverage, precision; edit audit logs for community data.

Data model refinements for SA
- User profile
  - Add: language preference(s), township/suburb, typical transport mode, disability status, household dependents, grant status (self-reported), documents on-hand (ID, proof of residence), device capability (offline-only, WhatsApp only, PWA).
- Opportunity
  - SA-specific categories: SASSA grants (child, disability, older persons, SRD), SETA learnerships, TVET courses, municipal aid, clinic/NGO services, day-labor gigs.
  - Eligibility fields mapped to SA norms: age bands, means tests, residency, ID type, supporting docs.

Trust & safety playbook
- Channel safety
  - Treat USSD as untrusted; no sensitive operations; display warnings and verification tips.
  - Publish official handles/shortcodes; in-app verification tool; scam-report hotline.
- Community data
  - Reputation and badges for ambassadors; soft limits for new accounts; geotagged submissions; photo evidence optional.
  - Moderator console; bulk updates; “staleness” decay of confidence.

Partnerships (priority targets)
- MNOs: Vodacom, MTN, Telkom, Cell C — zero-rating and short-code legitimacy.
- NGOs: Harambee/SA Youth, Gift of the Givers, local churches/mosques, clinics.
- Education: TVET colleges, SETAs (W&RSETA, MICTSETA, etc.), municipal skills centers.
- Retail/pharmacy: Shoprite/Checkers/Boxer/Clicks/Dis-Chem for pricing/promos data feeds.

Launch plan
- Phase 0 (2–3 weeks)
  - Offline-first PWA skeleton (English first; add Zulu/Xhosa next); WhatsApp bot MVP for FAQs.
  - Source adapters for SASSA calendars, NSFSAS/SETA/TVET pages, municipal clinics; community submission form.
  - DeepSeek extraction prompts; Parallel search templates; first SA-specific knowledge base.
- Phase 1 (4–6 weeks)
  - Cycle Breaker Score + urgency alerts; grants/training/job feeds with explanations; printable forms.
  - Moderator tools; trust/reputation; “freshness verified” labels; staleness decay.
  - SMS reminders; low-data analytics.
- Phase 2 (6–10 weeks)
  - Multilingual; more sources; price ranges with confidence; transport-aware routing; ambassador program.
  - Zero-rating pilot with one MNO; NGO referral pathways.

Decision log (from Kassa’s concerns)
- DO: PWA + WhatsApp; minimal/no PII on USSD; printable PDFs; community-driven freshness.
- DON’T: Promise secure USSD or deep gov API integrations in MVP; don’t hard-code exact prices; don’t expose sensitive actions via untrusted channels.

Open questions
- Which MNO can we realistically engage first for zero-rating?
- Which NGOs can supply trusted job/training listings to seed supply?
- Language priorities after English (Zulu vs Xhosa vs Afrikaans) for first expansion.

