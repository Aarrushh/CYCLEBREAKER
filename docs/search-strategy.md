# Search Strategy

Objectives
- High recall on reputable sources with minimal noise.
- Freshness: detect updates, deadlines, and rolling programs.
- Compliance: honor robots.txt, site ToS, and API usage limits.

Two Modes
1) On-demand (breadth): use Parallel API to search targeted sites and general web with profile-aware query templates.
2) Scheduled (depth): site-specific adapters that crawl APIs or key paths weekly/daily.

Query Generation
- From profile, generate intents: e.g., "small business grant Los Angeles", "training stipend disabled UK", "veteran scholarship Texas".
- DeepSeek expands with synonyms, local spellings, and site-specific query tokens.

Pipeline
- Search → URL set → fetch HTML → extract text/metadata → DeepSeek structure → dedup → eligibility rules → store → rank for user.

Targeted Sites (examples; see docs/sources.md)
- US: Grants.gov, SAM.gov, Challenge.gov, SBA, state economic development, city portals, Apprenticeship.gov, Workforce boards, major foundations.
- UK: GOV.UK (grants and funds), Innovate UK, NIHR, UKRI, local councils.
- EU: Funding & Tenders, Erasmus+, EIC.
- CA: GC Grants & Contributions, provincial programs.
- AU: business.gov.au, state programs.
- IN: MyScheme.gov.in aggregator, state schemes.
- Global: World Bank, UNDP, UNICEF, IFC, regional development banks.

Ranking
- Eligibility match score (rule satisfaction %).
- Freshness and deadline proximity.
- Source trust + program scale.
- Historical user feedback (saves, hides, conversions).

Fallbacks
- If Parallel fails, use Bing or Google CSE with site: filters. Cache and de-duplicate across providers.

