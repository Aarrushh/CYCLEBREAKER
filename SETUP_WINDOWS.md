# Windows Setup Guide — CycleBreaker SA

## Prerequisites Check

After installing Node.js, verify installation:
```powershell
node --version  # Should show v18.x or v20.x
npm --version   # Should show 9.x or 10.x
```

## Initial Setup

### 1. Install Dependencies
```powershell
# From project root
npm install
```

### 2. Configure Environment
```powershell
# Copy template
Copy-Item .env.example .env

# Edit with your keys
notepad .env
```

**Required for Week 1:**
```env
# Leave these for now (used in ingestion, optional)
DEEPSEEK_API_KEY=
PARALLEL_API_KEY=

# Basic app config
NODE_ENV=development
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://localhost:4000

# Optional: Add NVIDIA key if you have it (Phase 2)
NVIDIA_API_KEY=nvapi-your-key-here
AI_FEATURES_ENABLED=false
```

### 3. Start Development Servers
```powershell
# Start both API and Web
npm run dev

# Or start individually:
npm run dev:api  # http://localhost:4000
npm run dev:web  # http://localhost:3000
```

## Common Commands

### Development
```powershell
npm run dev          # Start both API + Web
npm run build        # Build all workspaces
npm run typecheck    # Run TypeScript checks
npm run lint         # Run linters
```

### Testing
```powershell
# Run all tests
npm test

# Test specific workspace
npm -w @cyclebreaker/shared test
npm -w @cyclebreaker/api test
```

### Ingestion (Week 2+)
```powershell
# Run data ingestion
npm -w @cyclebreaker/ingestion run ingest
```

## Project Structure

```
CYCLEBREAKER_APP/
├── apps/
│   ├── api/          # Fastify backend (Node.js)
│   │   └── src/
│   │       ├── routes/      # API endpoints
│   │       ├── services/    # Business logic
│   │       └── index.ts     # Server entry
│   └── web/          # Next.js frontend (React PWA)
│       └── app/
│           ├── onboarding/  # User profile creation
│           ├── feed/        # Opportunity feed
│           └── layout.tsx   # Root layout
├── packages/
│   ├── shared/       # Schemas & matching engine
│   │   ├── schema/
│   │   │   ├── userProfile.ts
│   │   │   └── opportunity.ts
│   │   └── src/
│   │       └── eligibility.ts
│   ├── ingestion/    # Data pipeline (Week 2+)
│   │   └── data/
│   │       └── curated/
│   │           └── sa_opportunities.json
│   └── ai/           # AI provider layer (Phase 2, Week 13+)
└── docs/             # All planning documents
```

## Week 1 Goals

### Day 1-2 ✅ (Already Done)
- [x] User Profile Schema
- [x] Opportunity Schema
- [x] JSON-logic evaluator
- [x] Explainability mapper
- [x] Curated SA dataset (7+ opportunities)

### Day 3-4 (Next)
- [ ] API: POST /profiles endpoint
- [ ] API: GET /feed endpoint
- [ ] API: GET /opportunities/:id endpoint
- [ ] Basic in-memory storage (Map)

### Day 5-6 (Final)
- [ ] Web: Onboarding form (React)
- [ ] Web: Feed page with explanations
- [ ] Basic PWA config (service worker)
- [ ] Offline caching setup

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port 4000 or 3000
netstat -ano | findstr :4000
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <PID> /F
```

### Module Not Found Errors
```powershell
# Clean install
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

### TypeScript Errors
```powershell
# Rebuild shared package
npm -w @cyclebreaker/shared run build

# Check for issues
npm run typecheck
```

### Cross-env Not Working
```powershell
# Reinstall
npm install -D cross-env

# Or run without it (Windows default)
npm -w @cyclebreaker/api run dev
```

## API Endpoints (Week 1 Implementation)

### POST /profiles
Create user profile
```json
{
  "location": { "country_code": "ZA", "province_code": "WC" },
  "demographics": { "age_bracket": "25_34", "citizenship_status": "citizen" },
  "economic": { "employment_status": "unemployed", "income_bracket": "lt_1000_zar" },
  "goals": { "primary_goal": "find_job" },
  "consent": { "terms_accepted_at": "2025-10-16T10:00:00Z", "consent_data_processing": true }
}
```

Response:
```json
{ "id": "uuid-here" }
```

### GET /feed?profile_id=uuid
Get matched opportunities
```json
{
  "matches": [
    {
      "opportunity": { /* opportunity object */ },
      "match_score": 0.85,
      "why": ["Province matches", "Income within threshold"],
      "matched_profile_fields": ["location.province_code", "economic.income_bracket"]
    }
  ]
}
```

### GET /opportunities/:id
Get single opportunity details
```json
{
  "id": "za_sassa_csg_2025",
  "title": "Child Support Grant (CSG)",
  "category": "grant",
  /* ... full opportunity */
}
```

## Next Steps After Setup

1. **Install Node.js** (if not done yet)
2. **Run `npm install`** from project root
3. **Copy `.env.example` to `.env`**
4. **Start with API endpoints** - See `docs/WEEK1_TASKS.md` for code examples
5. **Test with Postman/curl** - Verify endpoints work
6. **Build web interface** - React components for onboarding & feed

## Resources

- **Week 1 Tasks**: `docs/WEEK1_TASKS.md` (detailed code examples)
- **Full Roadmap**: `docs/DELIVERABLES_52WEEK.md` (52-week plan)
- **AI Integration**: `docs/ai-integration.md` (Phase 2, Week 13+)
- **Architecture**: `docs/architecture-hybrid.md` (Fastify + Firebase)

## Getting Help

- Check existing schemas in `packages/shared/schema/`
- Review eligibility engine in `packages/shared/src/eligibility.ts`
- Test JSON-logic rules with sample profiles
- Use curated data in `packages/ingestion/data/curated/sa_opportunities.json`

---

**You're 60% done with Week 1!** The hard part (schemas, matching engine) is complete. Now we build the API and UI to expose this functionality.
