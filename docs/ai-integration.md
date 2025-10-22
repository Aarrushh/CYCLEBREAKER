# AI Integration Strategy — NVIDIA API

## Overview

This document outlines the strategy for integrating NVIDIA AI capabilities into CycleBreaker SA. The approach is incremental, privacy-first, and explainable—AI enhances the deterministic matching engine without replacing it.

**Core Principle**: AI is an optional enhancement that makes the app smarter, not a black box that makes decisions for users. Users always see why and how AI is helping.

---

## Phase 2: Initial AI Features (Weeks 13-24)

### 1. Job Scam Detection
**Goal**: Protect users from fraudulent job postings and advance-fee scams

**Implementation**:
- Analyze job descriptions for suspicious patterns:
  - Unrealistic salary claims (e.g., "R50,000/month for entry-level")
  - Advance fee requests ("Pay R500 for uniform before starting")
  - Vague job descriptions with no company details
  - Promises of "easy money" or "work from home guaranteed"
  - Missing contact info or only WhatsApp numbers
- Confidence scoring: Low (0-0.4), Medium (0.4-0.7), High (0.7-1.0)
- Threshold for auto-flagging: 0.7 (configurable)

**User Experience**:
```
[!] Scam Risk: High
This job posting shows warning signs of a scam:
- Promises unusually high pay for entry-level work
- Requests advance payment for "registration fee"

We recommend:
- Verify the employer exists (search online)
- Never pay money upfront for a job
- Report this posting if it's fraudulent
```

**Technical Flow**:
1. New job posted (community or scraper)
2. Send description to NVIDIA API for analysis
3. Receive risk score + explanation
4. If score > threshold:
   - Flag for manual review
   - Show warning to users
   - Track outcome for model improvement
5. Store analysis in DB (cache for 30 days)

**API Call Example**:
```typescript
const analysis = await nvidia.detectScam({
  type: 'job',
  title: 'General Worker - Cape Town',
  description: 'Earn R15000 per month! No experience needed. Pay R300 registration...',
  organization: 'Quick Cash Jobs',
});

// Response:
{
  risk_score: 0.85,
  risk_level: 'high',
  flags: [
    'advance_fee_request',
    'unrealistic_salary',
    'generic_company_name'
  ],
  confidence: 0.92,
  explanation: 'This posting requests advance payment and promises unusually high pay for unskilled work, which are common scam indicators.'
}
```

### 2. Mashonisa Detection
**Goal**: Warn users about predatory loan terms before they commit

**Implementation**:
- Analyze loan offers for predatory patterns:
  - Interest rates >30% APR (NCR limit for unsecured credit)
  - Hidden fees or compounding structures
  - Collateral requirements disproportionate to loan amount
  - Threats or intimidation language
  - Lack of NCR registration
- Compare to legitimate lender baselines
- Suggest safer alternatives (registered credit providers, stokvels)

**User Experience**:
```
⚠️ High-Risk Loan
This loan offer shows signs of predatory lending:
- Interest rate: ~50% APR (legal limit: 30%)
- No NCR registration found
- Hidden "administration fees" of R500

Safer alternatives:
- African Bank: Personal loan, 28% APR, NCR registered
- Community stokvel: Interest-free, social support
```

**Technical Flow**:
1. User inputs loan terms or scans offer
2. Extract key terms (amount, duration, interest, fees)
3. Send to NVIDIA API for risk analysis
4. Calculate effective APR and compare to NCR limits
5. Show risk score + recommendations
6. Link to debt counseling if needed

**API Call Example**:
```typescript
const analysis = await nvidia.analyzeLoan({
  principal: 5000,
  repayment_amount: 7500,
  duration_weeks: 8,
  fees: { admin: 500, insurance: 200 },
  lender_name: 'Cash Now Loans',
});

// Response:
{
  effective_apr: 48.7,
  risk_score: 0.78,
  risk_level: 'high',
  flags: [
    'exceeds_ncr_limit',
    'high_fees',
    'unregistered_lender'
  ],
  ncr_compliant: false,
  recommendation: 'avoid',
  alternatives: [
    { name: 'African Bank', apr: 28, ncr_registered: true },
    { name: 'Capitec', apr: 26.5, ncr_registered: true }
  ]
}
```

### 3. Profile Categorization
**Goal**: Generate personalized socioeconomic action plans based on user profiles

**Implementation**:
- Analyze user profile to identify:
  - Urgency level (e.g., unemployed + dependents = high)
  - Asset gaps (no ID, no matric certificate)
  - Opportunity fit (skills vs. local jobs)
  - Financial vulnerability (income vs. dependents)
- Generate prioritized action plan
- Route content based on persona

**User Experience**:
```
Your Personalized Plan

Priority 1: Apply for Child Support Grant (R530/month)
✓ You're eligible (citizen, income <R5000)
✓ Documents ready: ID, birth certificate
⏰ Apply this week (processing takes 3 months)

Priority 2: Get your Matric certificate copy
📄 You need this for most job applications
💰 Free from your school or DoE
⏱️ Takes 2-3 weeks

Priority 3: Find nearby work
🎯 General worker jobs within 5km
💼 20 jobs match your profile this week
```

**Technical Flow**:
1. After onboarding, send anonymized profile to NVIDIA
2. AI analyzes:
   - Employment status + dependents → urgency
   - Income + grants → financial stress
   - Skills + local jobs → opportunity fit
   - Documents + goals → action roadmap
3. Generate structured plan with priorities
4. Map to app features (grants, jobs, training)
5. Track completion over time

**API Call Example**:
```typescript
const plan = await nvidia.categorizeProfile({
  demographics: {
    age_bracket: '25_34',
    citizenship: 'citizen',
  },
  economic: {
    employment_status: 'unemployed',
    income_bracket: 'lt_1000_zar',
    dependents_count: 2,
  },
  education_skills: {
    highest_education: 'matric',
    skills: ['cleaning', 'childcare'],
  },
  goals: {
    primary_goal: 'find_job',
  },
  location: {
    province: 'WC',
    geohash: 'k3vn1', // Khayelitsha
  },
});

// Response:
{
  persona: 'young_caregiver_job_seeker',
  urgency_level: 'high',
  financial_vulnerability: 0.75,
  priorities: [
    {
      order: 1,
      category: 'grant',
      action: 'apply_child_support_grant',
      monthly_value: 530,
      time_to_benefit: '3_months',
      eligibility_confidence: 0.95,
      required_documents: ['id', 'birth_certificate', 'proof_of_income'],
    },
    {
      order: 2,
      category: 'job',
      action: 'find_local_work',
      skills_match: ['childcare', 'cleaning'],
      commute_filter: 'within_5km',
      estimated_opportunities: 20,
    },
    {
      order: 3,
      category: 'training',
      action: 'early_childhood_development_course',
      rationale: 'Builds on childcare skills, high local demand',
      duration: '6_weeks',
      cost: 'free',
    },
  ],
  recommended_modules: ['grants', 'jobs', 'training'],
  content_routing: {
    language_pref: 'xh', // Xhosa
    literacy_level: 'basic',
    transport_constraint: 'high',
  },
}
```

### 4. Skill Gap Analysis
**Goal**: Help users understand which skills they need to get better jobs

**Implementation**:
- Compare user skills to local job requirements
- Identify high-demand skills in user's area
- Suggest training programs to bridge gaps
- Track skill development over time

**User Experience**:
```
Skills to Boost Your Opportunities

Your current skills:
✓ Cleaning
✓ Childcare

In-demand skills near you:
⭐ First Aid (23 jobs require this)
⭐ Cooking (18 jobs)
⭐ Basic computer skills (15 jobs)

Recommended training:
📚 First Aid Level 1 - Khayelitsha Community Health
   Duration: 2 days
   Cost: Free
   Opens 23 more job opportunities
```

**Technical Flow**:
1. Extract skills from user profile
2. Fetch local job requirements from DB
3. Send to NVIDIA for gap analysis
4. Identify high-ROI training (most jobs unlocked)
5. Match to available training programs
6. Track when user completes training

---

## Phase 3: Advanced AI Features (Weeks 25-36)

### 5. Document Validation (OCR)
**Goal**: Reduce grant application rejection rates due to invalid documents

**Implementation**:
- OCR for ID numbers, addresses, dates
- Validate ID number checksum (SA standard)
- Check document quality (blur, glare, cropping)
- Flag incomplete or mismatched info
- Provide correction guidance before submission

**User Experience**:
```
Document Check: ID Copy

✓ Image quality: Good
✗ ID number: Partially visible (last 2 digits cut off)
✓ Expiry date: Valid (expires 2028)

Fix required:
📸 Retake photo with full ID number visible
💡 Tip: Use a flat surface and good lighting
```

**Privacy Note**: OCR runs on-device or server-side with immediate deletion. No ID images stored long-term.

### 6. Health Literacy Content
**Goal**: Make health information accessible in simple, vernacular language

**Implementation**:
- Simplify medical jargon (e.g., "hypertension" → "high blood pressure")
- Translate health content to vernacular languages
- Generate medication adherence reminders
- Provide context for clinic instructions

**Important Constraints**:
- No diagnostic advice (legal liability)
- No treatment recommendations
- Only explanations and reminders
- Disclaimer gates on all health content

**User Experience**:
```
Your Clinic Visit Summary (Simplified)

Doctor said: "Patient presents with acute gastroenteritis"
In simple terms: You have stomach flu (infection in your stomach)

Medication reminder:
💊 Loperamide (Imodium): 2 tablets when you have diarrhea
⏰ Don't take more than 8 tablets per day
💧 Drink lots of water

When to come back:
- If symptoms last more than 3 days
- If you see blood in stool
- If you get a high fever
```

---

## AI Provider Architecture

### Provider Abstraction Layer
**Goal**: Make it easy to swap AI providers or use multiple providers

**Structure**:
```
packages/ai/
  ├── src/
  │   ├── providers/
  │   │   ├── interface.ts         # IAIProvider interface
  │   │   ├── nvidia.ts             # NVIDIA API client
  │   │   ├── fallback.ts           # Rule-based fallback
  │   │   └── mock.ts               # Testing mock
  │   ├── features/
  │   │   ├── scamDetection.ts      # Job/loan scam detection
  │   │   ├── profileCategorization.ts
  │   │   ├── skillGapAnalysis.ts
  │   │   ├── documentOCR.ts
  │   │   └── healthLiteracy.ts
  │   ├── utils/
  │   │   ├── rateLimiter.ts        # Token bucket rate limiting
  │   │   ├── costTracker.ts        # Track API spend
  │   │   ├── cache.ts              # Redis/in-memory cache
  │   │   └── logger.ts             # PII-scrubbed logging
  │   └── index.ts
  └── tests/
```

### Interface Definition
```typescript
// packages/ai/src/providers/interface.ts
export interface IAIProvider {
  name: string;
  
  // Feature methods
  detectScam(input: ScamDetectionInput): Promise<ScamDetectionResult>;
  analyzeLoan(input: LoanAnalysisInput): Promise<LoanAnalysisResult>;
  categorizeProfile(input: ProfileInput): Promise<ProfileCategorizationResult>;
  analyzeSkillGap(input: SkillGapInput): Promise<SkillGapResult>;
  extractDocumentData(input: DocumentInput): Promise<OCRResult>;
  simplifyHealthContent(input: HealthContentInput): Promise<SimplifiedContent>;
  
  // Lifecycle
  initialize(config: ProviderConfig): Promise<void>;
  healthCheck(): Promise<boolean>;
}
```

### NVIDIA Client Implementation
```typescript
// packages/ai/src/providers/nvidia.ts
import fetch from 'node-fetch';

export class NVIDIAProvider implements IAIProvider {
  name = 'nvidia';
  private apiKey: string;
  private baseUrl: string;
  
  async initialize(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.NVIDIA_API_KEY;
    this.baseUrl = config.baseUrl || process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    
    if (!this.apiKey) {
      throw new Error('NVIDIA_API_KEY is required');
    }
  }
  
  async detectScam(input: ScamDetectionInput): Promise<ScamDetectionResult> {
    const prompt = this.buildScamDetectionPrompt(input);
    const response = await this.callAPI('/chat/completions', {
      model: 'meta/llama-3.1-70b-instruct',
      messages: [
        { role: 'system', content: SCAM_DETECTION_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3, // Lower for more consistent results
      max_tokens: 500,
    });
    
    return this.parseScamDetectionResponse(response);
  }
  
  private async callAPI(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private buildScamDetectionPrompt(input: ScamDetectionInput): string {
    return `Analyze this ${input.type} posting for scam indicators:

Title: ${input.title}
Description: ${input.description}
Organization: ${input.organization || 'Unknown'}

Return JSON with:
- risk_score (0-1)
- risk_level (low/medium/high)
- flags (array of scam indicators found)
- explanation (1-2 sentences for users)`;
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.callAPI('/models', {});
      return true;
    } catch {
      return false;
    }
  }
}
```

### Fallback Provider (Rule-Based)
```typescript
// packages/ai/src/providers/fallback.ts
export class FallbackProvider implements IAIProvider {
  name = 'fallback';
  
  async detectScam(input: ScamDetectionInput): Promise<ScamDetectionResult> {
    // Simple rule-based detection
    const flags = [];
    let score = 0;
    
    const text = `${input.title} ${input.description}`.toLowerCase();
    
    // Check for advance fee requests
    if (text.match(/pay.*registration|pay.*uniform|send.*money/i)) {
      flags.push('advance_fee_request');
      score += 0.4;
    }
    
    // Check for unrealistic promises
    if (text.match(/guaranteed|easy money|work from home.*r\d{4,}/i)) {
      flags.push('unrealistic_promises');
      score += 0.3;
    }
    
    // Check for vague details
    if (!input.organization || input.organization === 'Unknown') {
      flags.push('missing_company_info');
      score += 0.2;
    }
    
    return {
      risk_score: Math.min(score, 1.0),
      risk_level: score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low',
      flags,
      confidence: 0.6, // Lower confidence for rule-based
      explanation: `Detected ${flags.length} warning sign(s): ${flags.join(', ')}`,
    };
  }
  
  // ... other methods with rule-based logic
}
```

---

## Rate Limiting & Cost Control

### Rate Limiter
```typescript
// packages/ai/src/utils/rateLimiter.ts
export class TokenBucketRateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private lastRefill: number;
  
  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }
  
  async consume(tokens: number = 1): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Usage
const limiter = new TokenBucketRateLimiter(100, 10); // 100 max, refill 10/sec
if (!await limiter.consume()) {
  throw new Error('Rate limit exceeded');
}
```

### Cost Tracker
```typescript
// packages/ai/src/utils/costTracker.ts
export class CostTracker {
  private costs = new Map<string, number>();
  
  track(feature: string, cost: number) {
    const current = this.costs.get(feature) || 0;
    this.costs.set(feature, current + cost);
    
    // Alert if daily cost exceeds threshold
    if (current + cost > this.getDailyThreshold(feature)) {
      this.alertHighCost(feature, current + cost);
    }
  }
  
  getDailyCost(feature?: string): number {
    if (feature) {
      return this.costs.get(feature) || 0;
    }
    return Array.from(this.costs.values()).reduce((sum, cost) => sum + cost, 0);
  }
  
  private getDailyThreshold(feature: string): number {
    const thresholds = {
      scam_detection: 5.0, // $5/day
      profile_categorization: 2.0,
      skill_gap: 1.0,
      ocr: 10.0,
    };
    return thresholds[feature] || 1.0;
  }
  
  private alertHighCost(feature: string, cost: number) {
    console.error(`[COST ALERT] ${feature} exceeded daily threshold: $${cost.toFixed(2)}`);
    // Send alert to monitoring system
  }
}
```

---

## Environment Configuration (Windows-Safe)

### .env Variables
```env
# AI Provider
NVIDIA_API_KEY=nvapi-your-key-here
NVIDIA_API_BASE_URL=https://integrate.api.nvidia.com/v1

# Feature Flags
AI_FEATURES_ENABLED=true
AI_SCAM_DETECTION_ENABLED=true
AI_PROFILE_CATEGORIZATION_ENABLED=true
AI_SKILL_GAP_ENABLED=false
AI_OCR_ENABLED=false
AI_HEALTH_LITERACY_ENABLED=false

# Thresholds
AI_SCAM_DETECTION_THRESHOLD=0.7
AI_MASHONISA_APR_THRESHOLD=30

# Rate Limits (requests per second)
AI_RATE_LIMIT_MAX=100
AI_RATE_LIMIT_REFILL=10

# Cost Limits (USD per day)
AI_DAILY_COST_LIMIT=20.0

# Fallback
AI_USE_FALLBACK_ON_ERROR=true
```

### npm Scripts (Windows-compatible)
```json
{
  "scripts": {
    "dev:api": "cross-env NODE_ENV=development npm -w @cyclebreaker/api run dev",
    "test:ai": "cross-env NODE_ENV=test npm -w @cyclebreaker/ai run test"
  }
}
```

---

## Privacy & Ethics

### Data Minimization
- Send only necessary fields to AI (never full PII)
- Anonymize profiles (strip ID numbers, names, exact addresses)
- Use hashed user IDs for tracking

### Transparency
- Show users when AI is being used
- Explain what data was sent and why
- Provide opt-out for AI features (use deterministic fallback)

### Bias Monitoring
- Track AI performance across demographics
- Monthly audits for fairness (age, gender, location)
- Community feedback loop for biased results

### Human Oversight
- High-stakes decisions (scam flags, debt advice) reviewed by humans
- AI suggestions, not commands
- Users always have final control

---

## Testing Strategy

### Unit Tests
```typescript
// packages/ai/tests/scamDetection.test.ts
describe('ScamDetection', () => {
  it('should flag advance fee requests', async () => {
    const result = await ai.detectScam({
      type: 'job',
      title: 'General Worker',
      description: 'Pay R500 registration fee to start',
    });
    
    expect(result.risk_level).toBe('high');
    expect(result.flags).toContain('advance_fee_request');
  });
  
  it('should not flag legitimate jobs', async () => {
    const result = await ai.detectScam({
      type: 'job',
      title: 'Cashier at Shoprite',
      description: 'R4500/month. Matric required. Apply with CV.',
      organization: 'Shoprite Holdings',
    });
    
    expect(result.risk_level).toBe('low');
  });
});
```

### Integration Tests
- Test with real NVIDIA API (staging environment)
- Verify rate limiting works
- Check cost tracking accuracy
- Test fallback provider activation

---

## Rollout Plan

### Week 13-14: Provider Layer
- ✅ Scaffold packages/ai
- ✅ Implement IAIProvider interface
- ✅ NVIDIA client with health check
- ✅ Fallback provider with rule-based logic
- ✅ Rate limiter and cost tracker

### Week 15-16: Scam Detection
- ✅ Job scam detection feature
- ✅ Prompt engineering and testing
- ✅ Integration with job ingestion pipeline
- ✅ Admin review queue for flagged content

### Week 17-18: Mashonisa Detection
- ✅ Loan analysis feature
- ✅ APR calculation and NCR compliance check
- ✅ UI for loan input/scanning
- ✅ Safer alternatives recommendation

### Week 19-20: Profile Categorization
- ✅ Profile analysis and persona generation
- ✅ Priority action plan generation
- ✅ Content routing based on persona
- ✅ Tracking completion over time

### Week 21-22: Skill Gap Analysis
- ✅ Skill extraction from local jobs
- ✅ Gap analysis and training recommendations
- ✅ ROI calculation (jobs unlocked per skill)
- ✅ Progress tracking

### Week 25-28: Document OCR
- ✅ OCR for ID and proof of residence
- ✅ SA ID number validation (checksum)
- ✅ Image quality checks
- ✅ Privacy safeguards (on-device or ephemeral processing)

### Week 29-32: Health Literacy
- ✅ Medical jargon simplification
- ✅ Vernacular translation
- ✅ Medication adherence reminders
- ✅ Legal disclaimers and content gates

---

## Success Metrics

### Technical Metrics
- AI API uptime: >99%
- Average response time: <2s
- Rate limit violations: <1%
- Daily cost: <$20
- Fallback activation rate: <5%

### Product Metrics
- Scam detection accuracy: >85% (validated by manual review)
- Mashonisa warnings prevent 10+ risky loans per month
- Profile categorization increases feed CTR by 20%
- Skill gap recommendations lead to 5+ training enrollments per month
- Document validation reduces grant rejection rate by 15%

### User Satisfaction
- Trust in AI recommendations: >70% (survey)
- Users understand AI explanations: >80%
- Opt-out rate: <10%
- Positive feedback on AI features: >60%

---

## Future Enhancements (Post-Week 36)

### Community Training Data
- Allow community to validate AI results
- Build SA-specific training dataset
- Fine-tune models on local patterns

### Multi-Provider Support
- Add OpenAI/Anthropic as alternative providers
- Route requests based on cost/quality tradeoffs
- A/B test providers for specific features

### On-Device AI
- Explore TensorFlow Lite for basic features
- Reduce API costs for simple tasks
- Improve offline functionality

---

## Conclusion

AI integration in CycleBreaker SA is designed to be:
- **Incremental**: Start simple (scam detection), expand gradually
- **Explainable**: Users always see reasoning, not just results
- **Privacy-first**: Minimal data sent, anonymized where possible
- **Cost-conscious**: Rate limiting, fallbacks, daily budget alerts
- **Community-driven**: Human oversight, feedback loops, validation

The goal is to make the app smarter without sacrificing trust, transparency, or user control. AI is a tool to amplify human judgment, not replace it.
