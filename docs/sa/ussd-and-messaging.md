# USSD and Messaging Strategy

Reality check from the PDF: USSD is insecure, spoofable, lacks session storage, and cannot safely carry PII or sensitive actions.

Positioning
- Do not rely on USSD for authentication, PII collection, or financial/health-critical actions.
- Limit USSD to: read-only info menus, official channel verification, and “request a callback” (with explicit consent) via the carrier.

Safer alternatives
- Offline-first PWA: caches critical flows; encrypts local storage; extremely data-light.
- WhatsApp Business: conversational flows with better security posture; OTP verification; deep-links back into PWA.
- SMS: outbound reminders and one-time codes; never include sensitive data.

Anti-scam measures
- Publish official short codes and verified links; in-app “verify a code/URL” checker.
- Rotating signed tokens in links; short expiry.
- Friction screens for risky flows (e.g., grant claims) describing red flags.

Operational notes
- Pursue zero-rating with MNOs so the PWA works without user-paid data.
- Preload a content pack after install while on Wi‑Fi (public hotspot, school, NGO) to maximize offline capability.

