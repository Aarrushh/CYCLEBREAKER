# CycleBreaker SA — 52-Week Comprehensive Deliverables

## Overview

This document maps the full-stack engineering vision (52 weeks, 6 modules, AI-powered) to the existing MVP architecture and planning. It reconciles two complementary approaches:

1. **MVP Plan (docs/plan.md, docs/roadmap.md)**: PWA-first, deterministic rules, curated data, 4–6 week rapid validation
2. **Full-Scale Plan (this document)**: Firebase integration, 6 comprehensive modules, AI-enhanced features, SMS/USSD, 52-week rollout

Both approaches share the same mission: **break the poverty cycle for SA township residents through hyper-local, transport-aware, trust-centric opportunity matching**.

---

## Core Mission & Rationale

### Primary Goals
- **Eliminate "transport tax"**: Hyper-local job matching with true commute cost calculation
- **Financial empowerment**: Literacy tools, stokvel support, mashonisa detection, budgeting
- **Bureaucracy navigation**: Simplify SASSA grants, healthcare access, documentation
- **AI-driven personalization**: Relevant opportunities via intelligent matching and categorization
- **Radical accessibility**: Low-end smartphones, SMS/USSD for feature phones, offline-first

### Target Users (SA Townships)
- Unemployed/underemployed youth (primary)
- Caregivers receiving SASSA grants
- Informal economy workers
- TVET/SETA learners
- Community savers (stokvels)

---

## 6-Module Architecture

### Current MVP Scope (Existing Docs)
1. **Jobs**: Transport-aware listings, digital CV guidance, SAYouth.mobi linkouts
2. **Grants**: SASSA eligibility checks, document checklists, legal aid linkouts
3. **Training/Skills**: TVET/SETA programs, digital literacy content
4. **Savings/Debt**: Calculators, educational content, stokvel planners

### Expanded Full-Scale Modules (New)
5. **Health**: Clinic mapping, queue tracking, appointment reminders, health literacy
6. **Debt Management (Standalone)**: Multi-source tracker, mashonisa risk alerts, repayment AI advice

#### Module 1: Jobs
**MVP Features (Week 1-4)**
- Job feed with transport-aware filtering
- Profile skills matching
- "Near me" and "no experience" filters
- SAYouth.mobi and ESSA linkouts

**Full-Scale Enhancements (Week 5-24)**
- Real-time transport cost calculator (Google Maps API)
- In-app employer messaging
- AI job description parsing for skill extraction
- Scam detection via pattern recognition
- Digital CV builder with templates
- Application status tracking

**Technical Stack**
- Current: Fastify API + SQLite/PG, JSON-logic rules
- Enhanced: Firebase Realtime Database for messaging, NVIDIA AI for scam detection

#### Module 2: Skills/Education
**MVP Features (Week 1-4)**
- Curated TVET/SETA programs
- Digital literacy linkouts (Khan Academy, FunDza)

**Full-Scale Enhancements (Week 13-24)**
- Interactive skill quizzes addressing literacy gaps
- Partner API integration for training programs
- AI-powered personalized course recommendations
- Progress tracking and credential wallet
- Micro-learning modules optimized for data constraints

**Technical Stack**
- Current: Static content + curated links
- Enhanced: Firebase for progress tracking, NVIDIA AI for skill gap analysis

#### Module 3: Money & Financial Literacy
**MVP Features (Week 1-6)**
- Basic budgeting calculator
- Savings goal tracking
- Educational content linkouts (JustMoney, Black Sash)

**Full-Scale Enhancements (Week 13-36)**
- Budgeting templates with township cost baselines
- Debt repayment optimizer
- Stokvel digital management (group ledger, contribution tracking)
- Financial literacy micro-content (vernacular languages)
- Safe borrowing practices guidance

**Technical Stack**
- Current: Client-side calculators
- Enhanced: Firebase for group features, NVIDIA AI for personalized advice

#### Module 4: Government Services
**MVP Features (Week 1-6)**
- SASSA grant eligibility highlights
- Document checklists
- Navigators mirroring SASSA portal flows
- Legal aid linkouts (Black Sash)

**Full-Scale Enhancements (Week 25-36)**
- Guided SASSA application flow with step validation
- Document photo upload with OCR validation
- Application deadline alerts via SMS
- Status tracking and appeals support
- Community-contributed tips forum

**Technical Stack**
- Current: Static guides + checklists
- Enhanced: Firebase Storage for documents, SMS integration, OCR via AI

#### Module 5: Health (NEW)
**Week 25-36 Deliverables**
- Local clinic mapper with operating hours
- Real-time queue estimation (community-reported)
- Appointment reminders (SMS/push)
- Wait-time heuristics per facility
- Health literacy micro-content
- Medication adherence tracking (optional)

**Important Constraints**
- No medical advice (legal liability)
- Only wayfinding and system navigation
- Official links to Department of Health resources
- Disclaimer gates for any health content

**Technical Stack**
- Firebase for queue reports, Google Maps for clinic locations
- SMS reminders via aggregator partner

#### Module 6: Debt Management (NEW - Standalone from Money Module)
**Week 13-36 Deliverables**
- Multi-source debt tracker (mashonisa, stores, banks)
- AI-powered repayment prioritization
- Mashonisa risk detection and warnings
- Directory of legitimate lenders
- Negotiation SMS templates
- Debt counseling service linkouts (NCR-registered)

**Critical Safety Features**
- Scam pattern detection (AI)
- Warning flags for predatory terms
- Community-verified lender ratings
- Emergency support contacts

**Technical Stack**
- NVIDIA AI for risk analysis and pattern detection
- Firebase for secure debt records (encrypted)
- Disclaimer: No regulated financial advice

---

## 5-Phase Development Workflow (52 Weeks)

### Phase 1 – Core Build (Weeks 1–12)
**Objective**: Validate MVP with Jobs, Grants, Training basics

**Week 1-2** ✅ (Existing WEEK1_TASKS.md)
- Finalize schemas (UserProfile, Opportunity)
- JSON-logic evaluator + explainability
- Curated SA dataset (20-40 items)
- Basic API endpoints + PWA

**Week 3-4**
- Transport-aware distance scoring (Haversine/geohash)
- Admin verification UI for provenance
- Basic savings calculator + grant checklists
- Feedback collection hooks

**Week 5-8**
- Expand curated dataset to 50-80 items
- SMS verification setup (Twilio/Africa's Talking)
- Offline map tiles for transport routing
- Language scaffolding (Zulu/Xhosa)

**Week 9-12**
- Firebase setup (optional parallel to Fastify)
- User authentication (Firebase Auth or JWT)
- Community submission form + moderation v0
- Basic push notifications

**Phase 1 Deliverables**
- ✅ Working MVP with Jobs + Grants + Training
- ✅ Profile-driven matching with explainability
- ✅ Offline PWA with service worker
- ✅ 50+ verified SA opportunities
- 🔄 Basic transport cost awareness
- 🔄 Admin verification workflow

### Phase 2 – AI & Matching (Weeks 13–24)
**Objective**: Enhance matching with AI, add Money + Debt modules

**Week 13-16**
- NVIDIA AI provider abstraction (packages/ai)
- AI-powered job description parsing
- Scam detection patterns (loan/job offers)
- Basic skill gap analysis

**Week 17-20**
- Budgeting tools with AI recommendations
- Debt management module foundation
- Mashonisa pattern detection
- Stokvel group management (digital ledger)

**Week 21-24**
- Advanced transport logic (Google Maps API integration)
- AI-driven opportunity categorization
- Profile enrichment suggestions
- Personalized financial literacy content routing

**Phase 2 Deliverables**
- ✅ AI provider layer with NVIDIA integration
- ✅ Jobs module with scam filtering
- ✅ Money & Debt modules functional
- ✅ Transport cost calculator with real routes
- 🔄 Stokvel digital management
- 🔄 AI-powered content personalization

### Phase 3 – Government & Health (Weeks 25–36)
**Objective**: Add Government Services + Health modules, SMS integration

**Week 25-28**
- SASSA guided flow with step validation
- Document upload with Firebase Storage
- OCR validation for ID/proof of residence
- Grant status tracking

**Week 29-32**
- Health module: clinic mapper + queue tracking
- Community-reported wait times
- Appointment reminder system (SMS + push)
- Health literacy micro-content

**Week 33-36**
- SMS digest feature (budget permitting)
- Community tips forum (moderated)
- Appeals support workflow for grants
- Multi-language expansion (Sotho, Tswana)

**Phase 3 Deliverables**
- ✅ Government Services module complete
- ✅ Health module with clinic mapping
- ✅ SMS integration for reminders
- ✅ Document management with OCR
- 🔄 Community forum with moderation
- 🔄 4+ languages supported

### Phase 4 – Community & Scalability (Weeks 37–48)
**Objective**: Community features, trust mechanisms, multi-channel access

**Week 37-40**
- Community forum enhancements
- Peer reviews and ratings
- Multi-level verification badges
- Ambassador program setup

**Week 41-44**
- USSD-lite integration (read-only, via partner)
- WhatsApp bot for FAQs
- Agent/kiosk mode for onboarding
- Offline-first data sync optimization

**Week 45-48**
- Fraud prevention layer
- Performance optimization (lazy loading, CDN)
- Accessibility audit (WCAG 2.1 AA)
- Analytics dashboard for impact metrics

**Phase 4 Deliverables**
- ✅ Community interaction features
- ✅ Multi-channel access (PWA + SMS + USSD + WhatsApp)
- ✅ Trust mechanisms (verification, ratings)
- ✅ Agent/kiosk onboarding mode
- 🔄 Performance optimization complete
- 🔄 Fraud detection layer

### Phase 5 – QA, Launch, Scale (Weeks 49–52)
**Objective**: Production readiness, beta pilot, continuous improvement

**Week 49-50**
- Full QA suite (unit + integration + e2e)
- Security audit (POPIA compliance)
- Load testing and performance tuning
- Disaster recovery procedures

**Week 51**
- Beta pilot in 1-2 townships
- User research and feedback loops
- Community partnership activation
- Zero-rating negotiation with MNOs

**Week 52**
- Public launch preparation
- Monitoring dashboards (Sentry, Datadog)
- Support documentation
- Success metrics tracking

**Phase 5 Deliverables**
- ✅ Production-ready platform
- ✅ Security and privacy audits passed
- ✅ Beta pilot feedback incorporated
- ✅ Launch metrics and monitoring
- 🔄 Zero-rating partnership active
- 🔄 Community support network

---

## Technology Stack Comparison

### Current MVP Stack (Existing Docs)
```
Frontend: Next.js, React, PWA
Backend: Fastify (Node.js)
Database: SQLite/PostgreSQL
Search: Optional Meilisearch
Matching: JSON-logic deterministic rules
AI: DeepSeek for extraction (ingestion only)
Hosting: TBD (Vercel/Railway/local)
```

### Enhanced Full-Scale Stack (Integrated)
```
Frontend: Next.js, React, PWA (same)
Backend: Fastify + Firebase (parallel/hybrid)
  - Fastify for matching/feed APIs
  - Firebase for realtime (messaging, queues, groups)
Database: PostgreSQL (canonical) + Firebase Realtime DB
Storage: Firebase Storage (documents, photos)
Auth: Firebase Auth or JWT
Matching: JSON-logic + NVIDIA AI enhancements
AI Provider: NVIDIA API (scam detection, categorization, advice)
SMS/USSD: Africa's Talking or Twilio
Maps: Google Maps API (free tier, transport routing)
Monitoring: Sentry, Datadog, Firebase Analytics
Hosting: Vercel (frontend), Railway/GCP (backend)
```

### Architecture Decision: Hybrid Approach
**Recommendation**: Keep Fastify for core matching/feed logic (deterministic, explainable) + add Firebase for realtime features (messaging, groups, queues).

**Rationale**:
- Deterministic matching engine remains auditable (critical for trust)
- Firebase enables realtime features without complex infrastructure
- Gradual migration path from MVP to full-scale
- Cost control (Firebase free tier + pay-as-you-grow)

---

## API Architecture

### Core API Endpoints (Existing)
```
POST /profiles          - Create user profile
GET  /feed              - Get personalized opportunities
GET  /opportunities/:id - Get opportunity details
POST /feedback          - Submit user feedback
```

### Enhanced Endpoints (Full-Scale)
```
# Jobs Module
POST /jobs              - Create job posting
GET  /jobs/:id/commute  - Calculate transport cost
POST /jobs/:id/apply    - Track application
GET  /jobs/:id/messages - Employer messaging (Firebase)

# Skills Module
GET  /skills/quiz       - Interactive skill assessment
POST /skills/progress   - Track learning progress
GET  /skills/recommendations - AI-powered course suggestions

# Money & Debt
POST /budget            - Save budget plan
GET  /debt/analysis     - AI debt repayment analysis
POST /stokvel/group     - Create stokvel group (Firebase)
GET  /stokvel/:id       - Group ledger and contributions

# Government Services
POST /grant/application - Start SASSA application flow
POST /grant/documents   - Upload supporting documents
GET  /grant/:id/status  - Track application status

# Health Module
GET  /clinics           - Nearby clinics with queue times
POST /clinic/:id/queue  - Report current queue status
POST /appointments      - Set reminder for appointment

# Community
POST /forum/topics      - Create discussion topic
GET  /forum/:id         - Get topic with replies
POST /reviews/:id       - Submit employer/service review
```

---

## AI Integration Strategy (NVIDIA API)

### Phase 2 AI Features (Weeks 13-24)
1. **Job Scam Detection**
   - Pattern analysis of job descriptions
   - Flag suspicious salary claims, advance fee requests
   - Confidence scoring + human review queue

2. **Mashonisa Detection**
   - Analyze loan terms for predatory patterns
   - Flag interest rates >30% APR
   - Community-reported lender verification

3. **Profile Categorization**
   - Analyze user profile to generate socioeconomic persona
   - Recommend priority actions (e.g., "Apply for CSG first, then job search")
   - Tailored content routing

4. **Skill Gap Analysis**
   - Compare user skills to job requirements
   - Suggest training programs to bridge gaps
   - Track skill development over time

### Phase 3 AI Features (Weeks 25-36)
5. **Document Validation**
   - OCR for ID numbers, address verification
   - Flag incomplete/invalid documents before submission
   - Reduce grant application rejection rates

6. **Health Literacy Content**
   - Simple, vernacular explanations of medical terms
   - Medication adherence reminders
   - No diagnostic advice (legal boundary)

### AI Safety & Ethics
- **Explainability**: All AI decisions include human-readable reasoning
- **Human oversight**: High-stakes decisions (scam flags, debt advice) reviewed
- **Privacy**: AI processes anonymized/aggregated data where possible
- **Bias monitoring**: Regular audits for fairness across demographics
- **User control**: Users can disable AI features and use deterministic matching only

### Technical Implementation
```
packages/ai/
  ├── src/
  │   ├── providers/
  │   │   ├── nvidia.ts      # NVIDIA API client
  │   │   ├── interface.ts   # Provider abstraction
  │   ├── features/
  │   │   ├── scamDetection.ts
  │   │   ├── debtAnalysis.ts
  │   │   ├── profileCategorization.ts
  │   │   ├── skillGapAnalysis.ts
  │   └── utils/
  │       ├── rateLimiter.ts
  │       ├── costTracker.ts
  └── tests/
```

**Environment Variables (Windows-safe)**
```bash
NVIDIA_API_KEY=your_key_here
NVIDIA_API_BASE_URL=https://integrate.api.nvidia.com/v1
AI_FEATURES_ENABLED=true
AI_SCAM_DETECTION_THRESHOLD=0.7
```

---

## Success Metrics & KPIs

### MVP Success Criteria (Phase 1, Week 1-12)
- [ ] 50+ verified SA opportunities with provenance
- [ ] Profile completion rate >80%
- [ ] Feed CTR (click-through) >15%
- [ ] Transport cost estimation error <15%
- [ ] App load time <3s on low-end device
- [ ] Offline functionality for cached content
- [ ] Zero broken links in curated dataset

### Full-Scale Success Criteria (Week 52)
- [ ] 500-1,500 active opportunities across all categories
- [ ] 60%+ user retention after 30 days
- [ ] Median time-to-first-relevant-result <30s
- [ ] SMS delivery rate >98%
- [ ] Grant application completion rate increase (vs. baseline)
- [ ] User-reported scam avoidance incidents
- [ ] Stokvel group adoption (10+ active groups)
- [ ] Health: Reduced clinic wait times (user-reported)
- [ ] Community forum: 100+ active contributors

### Impact Metrics (Qualitative)
- User testimonials: "Found a job within 2 weeks"
- Avoided predatory loan due to mashonisa warning
- Successfully applied for CSG with document checklist
- Joined stokvel through app, saved R500/month
- Reduced commute cost by finding nearby work

---

## Risks & Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| USSD security/spoofing | Exclude from MVP; later USSD-lite read-only via MNO partner |
| Firebase cost overruns | Set budget alerts; use free tier; optimize realtime usage |
| Google Maps API costs | Cache routes aggressively; use free tier; fallback to OSM |
| AI API rate limits | Rate limiter; queue non-urgent requests; cache results |
| POPIA compliance gaps | Legal review; minimal PII; consent gates; encryption at rest |

### Product Risks
| Risk | Mitigation |
|------|------------|
| Low adoption | Community ambassadors; airtime incentives; NGO partnerships |
| Data quality drift | Provenance labels; admin verification; community reporting |
| Scam content | AI + manual moderation; user reporting; verification badges |
| Competing apps | Focus on SA-specific, transport-aware, explainable matching |
| Zero-rating delays | PWA offline-first; partner with MNOs early; backup: free WiFi spots |

### Social Risks
| Risk | Mitigation |
|------|------------|
| Privacy concerns | Minimal PII; on-device storage; POPIA compliance; transparent ToS |
| Digital literacy gaps | Multi-channel (SMS, USSD, WhatsApp); agent/kiosk mode; icons |
| Trust in AI decisions | Explainability first-class; human oversight; deterministic fallback |
| Accessibility barriers | WCAG audit; vernacular languages; low-bandwidth optimization |

---

## Windows Development Setup (Updated)

### Environment Setup
```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit .env with your keys
notepad .env
```

**Required API Keys**:
```env
NVIDIA_API_KEY=nvapi-your-key-here
GOOGLE_MAPS_API_KEY=AIza-your-key-here (optional, Week 21+)
SMS_API_KEY=your-sms-provider-key (optional, Week 33+)
```

### Fixed npm Scripts (Windows-compatible)
```json
{
  "scripts": {
    "dev": "concurrently -k \"npm:dev:api\" \"npm:dev:web\"",
    "dev:api": "cross-env NODE_ENV=development npm -w @cyclebreaker/api run dev",
    "dev:web": "cross-env NODE_ENV=development npm -w @cyclebreaker/web run dev",
    "build": "npm -ws run build",
    "typecheck": "npm -ws run typecheck",
    "lint": "npm -ws run lint"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "cross-env": "^7.0.3"
  }
}
```

### Install cross-env
```powershell
npm install -D cross-env
```

---

## Reconciliation: MVP vs. Full-Scale

### What Stays the Same
- PWA-first, offline-capable architecture
- Deterministic JSON-logic matching engine
- Explainability as first-class feature
- Minimal PII, POPIA compliance
- Curated, provenance-labeled data sources
- Transport-aware, hyper-local focus
- SA-specific persona targeting

### What Gets Added (Full-Scale)
- Firebase for realtime features (messaging, groups, queues)
- NVIDIA AI for scam detection, debt analysis, categorization
- SMS/USSD multi-channel access
- Google Maps for accurate transport routing
- Health module with clinic mapping
- Standalone Debt Management module with mashonisa detection
- Community forum with moderation
- Agent/kiosk onboarding mode

### Recommended Approach
1. **Execute MVP first** (Weeks 1-12, existing plan)
   - Validate core hypothesis with minimal scope
   - Get real user feedback in 1-2 townships
   - Establish trust with community partnerships

2. **Incrementally add full-scale features** (Weeks 13-52)
   - Prioritize based on user feedback
   - Phased rollout to manage complexity
   - Cost-aware (Firebase free tier, API quotas)

3. **Maintain dual architecture** (Hybrid)
   - Keep Fastify + deterministic rules (trustworthy, auditable)
   - Add Firebase for features requiring realtime (groups, messaging)
   - NVIDIA AI as optional enhancement, not replacement

---

## Next Steps

### Immediate (Week 1)
1. ✅ Review this comprehensive deliverables document
2. 🔄 Execute existing WEEK1_TASKS.md (schemas, evaluator, curated data)
3. 🔄 Set up Windows-safe environment (cross-env, .env)
4. 🔄 Scaffold packages/ai with NVIDIA provider abstraction

### Short-term (Weeks 2-4)
1. Complete Phase 1 MVP deliverables
2. Set up Firebase project (optional, parallel track)
3. Test hybrid architecture with one realtime feature (e.g., user messaging)
4. Begin AI integration planning (scam detection first)

### Medium-term (Weeks 5-12)
1. Validate MVP with beta users
2. Measure key metrics (profile completion, feed CTR, retention)
3. Decide on full-scale feature prioritization based on feedback
4. Secure partnerships (NGOs, MNOs for zero-rating)

### Long-term (Weeks 13-52)
1. Execute phased rollout per 5-phase plan
2. Add modules incrementally (Money → Debt → Gov → Health)
3. Expand AI features with safety guardrails
4. Scale to multiple townships and provinces

---

## Conclusion

This 52-week plan is ambitious but grounded in the existing MVP foundation. The hybrid architecture preserves the strengths of the deterministic approach (trust, explainability) while enabling powerful realtime and AI-enhanced features.

**Key Success Factors**:
- Start small, validate early (MVP first)
- Incremental complexity (phased rollout)
- User feedback drives priorities
- Cost control (free tiers, pay-as-you-grow)
- Community trust (explainability, privacy, partnerships)

**Most Important**: This isn't a rigid 52-week plan. It's a **roadmap with off-ramps**. After MVP validation (Week 12), reassess priorities based on what users actually need and use. The full-scale vision provides direction, but user impact determines the path.

---

## Document Version
- **Version**: 1.0
- **Last Updated**: 2025-10-16
- **Author**: CycleBreaker Engineering Team
- **Status**: Planning / Alignment
