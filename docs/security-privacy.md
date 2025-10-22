# Security & Privacy

Principles
- Collect the minimum PII necessary; be transparent and obtain consent.
- Encrypt at rest and in transit. Restrict access via roles and least privilege.

Practices
- Secrets via environment variables, not in code. Rotate regularly.
- Log redaction: never log raw PII or API keys. Use structured logs.
- Data retention: allow users to delete their data; define default retention windows.
- Model safety: avoid sending unnecessary PII to third-party APIs; mask where possible.
- Compliance: honor robots.txt; respect site ToS; cite sources.

