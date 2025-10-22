# Data Pipeline

Stages
1) Discovery
   - Query generation (DeepSeek); web search (Parallel); dedupe URLs; site constraints loaded from config.
2) Fetch
   - Respect robots.txt; rate-limit per host; cache responses; language detection.
3) Extract
   - Parse HTML/JSON; normalize; extract structured fields with DeepSeek prompts tuned per category.
4) Deduplicate
   - Canonicalize URLs; simhash/shingles; merge duplicates; track canonical record.
5) Validate
   - Required fields: title, source, apply URL, category, region; run sanity checks on amounts and dates.
6) Store
   - Upsert Opportunity, Source, Organization; index text for search.
7) Score & Explain
   - Eligibility rules vs user profile; compute match_score; generate human-readable why_matched.
8) Refresh
   - Re-crawl on schedule; expire or archive past-deadline items; diff changes.

Artifacts
- RawDocument, ParsedContent, StructuredOpportunity, EligibilityRules, ExtractionLogs.

