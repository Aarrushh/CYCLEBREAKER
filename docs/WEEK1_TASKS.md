# Week 1 Development Tasks — CycleBreaker SA MVP

## Overview
Week 1 objectives: Create the foundational schemas, matching engine, and basic UI to demonstrate profile-driven opportunity matching with explainability for SA-specific opportunities.

## Day 1-2: Schema Design & Core Logic

### Task 1.1: Finalize User Profile Schema
**Location:** `packages/shared/schema/userProfile.ts`

Create the minimal profile schema focusing on SA-specific fields:

```typescript
import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  
  location: z.object({
    country_code: z.literal('ZA'),
    province_code: z.enum(['WC', 'GP', 'KZN', 'EC', 'FS', 'NW', 'NC', 'MP', 'LP']),
    municipality: z.string().optional(),
    postal_code: z.string().optional(),
    geohash: z.string().length(5).optional(), // 5-char = ~4.9km precision
  }),
  
  demographics: z.object({
    age_bracket: z.enum(['16_17', '18_24', '25_34', '35_49', '50_plus']).optional(),
    citizenship_status: z.enum(['citizen', 'permanent_resident', 'refugee', 'other']).optional(),
    disability_status: z.enum(['none', 'physical', 'visual', 'hearing', 'intellectual', 'multiple']).optional(),
  }).optional(),
  
  economic: z.object({
    employment_status: z.enum(['unemployed', 'informal_employed', 'formal_employed', 'self_employed', 'student']).optional(),
    income_bracket: z.enum(['lt_1000_zar', '1000_3000_zar', '3000_5000_zar', '5000_plus_zar']).optional(),
    dependents_count: z.number().int().min(0).max(10).optional(),
  }).optional(),
  
  education_skills: z.object({
    highest_education_level: z.enum(['no_schooling', 'primary', 'secondary', 'matric', 'tvet', 'diploma', 'degree']).optional(),
    skills: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
  }).optional(),
  
  constraints: z.object({
    transport_mode: z.enum(['walk', 'taxi', 'bus', 'private']).optional(),
    max_commute_km: z.number().min(1).max(50).optional(),
    internet_access: z.enum(['none', 'limited', 'unlimited']).optional(),
    device_type: z.enum(['feature_phone', 'smartphone_lowend', 'smartphone_midrange']).optional(),
    time_availability_hours_per_week: z.number().min(1).max(168).optional(),
  }).optional(),
  
  goals: z.object({
    primary_goal: z.enum(['find_job', 'get_grant', 'get_training', 'reduce_costs']).optional(),
    preferred_categories: z.array(z.enum(['jobs', 'grants', 'training', 'savings', 'health', 'debt'])).optional(),
    language_prefs: z.array(z.enum(['en', 'af', 'zu', 'xh', 'st', 'nso', 'tn', 've', 'ts', 'ss', 'nr'])).optional(),
  }).optional(),
  
  consent: z.object({
    terms_accepted_at: z.string().datetime(),
    consent_data_processing: z.boolean(),
    retention_days: z.number().int().min(30).max(3650).optional(),
    share_anonymized: z.boolean().optional(),
  }),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Helper to convert income_bracket to numeric for rule evaluation
export const incomeToNumeric = (bracket?: string): number => {
  switch (bracket) {
    case 'lt_1000_zar': return 500;
    case '1000_3000_zar': return 2000;
    case '3000_5000_zar': return 4000;
    case '5000_plus_zar': return 7500;
    default: return 0;
  }
};
```

### Task 1.2: Create Opportunity Schema
**Location:** `packages/shared/schema/opportunity.ts`

```typescript
import { z } from 'zod';

export const OpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['job', 'training', 'grant', 'service']),
  organization: z.string().optional(),
  
  regions: z.array(z.string()), // e.g., ["ZA-WC-CPT", "ZA-GP-JHB"]
  
  value_amount: z.number().optional(),
  value_currency: z.literal('ZAR').optional(),
  deadline: z.string().datetime().optional(),
  
  required_documents: z.array(z.string()).optional(),
  eligibility_rules: z.array(z.any()), // JSON-logic rules
  
  source_url: z.string().url(),
  apply_url: z.string().url().optional(),
  
  provenance: z.object({
    extraction_method: z.enum(['manual_curated', 'static_html', 'api']),
    evidence_links: z.array(z.string().url()).optional(),
    last_seen_at: z.string().datetime(),
    last_verified_at: z.string().datetime().optional(),
    freshness_score: z.number().min(0).max(1).optional(),
  }),
});

export type Opportunity = z.infer<typeof OpportunitySchema>;
```

### Task 1.3: Implement JSON-Logic Evaluator
**Location:** `packages/shared/src/eligibility.ts`

```typescript
export type JsonLogicRule = any;

export function evaluateRule(rule: JsonLogicRule, profile: any): boolean {
  if (typeof rule !== 'object' || rule === null) {
    return !!rule;
  }

  const operator = Object.keys(rule)[0];
  const operand = rule[operator];

  switch (operator) {
    case 'all':
      return Array.isArray(operand) && operand.every(r => evaluateRule(r, profile));
    
    case 'any':
      return Array.isArray(operand) && operand.some(r => evaluateRule(r, profile));
    
    case 'not':
      return !evaluateRule(operand, profile);
    
    case 'eq':
      return getValue(operand[0], profile) === getValue(operand[1], profile);
    
    case 'ne':
      return getValue(operand[0], profile) !== getValue(operand[1], profile);
    
    case 'lt':
      return getValue(operand[0], profile) < getValue(operand[1], profile);
    
    case 'lte':
      return getValue(operand[0], profile) <= getValue(operand[1], profile);
    
    case 'gt':
      return getValue(operand[0], profile) > getValue(operand[1], profile);
    
    case 'gte':
      return getValue(operand[0], profile) >= getValue(operand[1], profile);
    
    case 'in':
      const value = getValue(operand[0], profile);
      const array = getValue(operand[1], profile);
      return Array.isArray(array) && array.includes(value);
    
    case 'contains':
      const container = getValue(operand[0], profile);
      const item = getValue(operand[1], profile);
      return Array.isArray(container) && container.includes(item);
    
    case 'exists':
      return getValue(operand, profile) !== undefined;
    
    case 'missing':
      return getValue(operand, profile) === undefined;
    
    case 'var':
      return getValue(rule, profile);
    
    default:
      return false;
  }
}

function getValue(operand: any, profile: any): any {
  if (typeof operand === 'object' && operand.var) {
    const path = operand.var.split('.');
    let current = profile;
    for (const key of path) {
      current = current?.[key];
    }
    
    // Special handling for income_bracket_numeric
    if (operand.var === 'economic.income_bracket_numeric') {
      return incomeToNumeric(current);
    }
    
    return current;
  }
  return operand;
}

// Helper function (import from userProfile.ts)
function incomeToNumeric(bracket?: string): number {
  switch (bracket) {
    case 'lt_1000_zar': return 500;
    case '1000_3000_zar': return 2000;
    case '3000_5000_zar': return 4000;
    case '5000_plus_zar': return 7500;
    default: return 0;
  }
}
```

## Day 3-4: Explainability & Sample Data

### Task 1.4: Create Explainability Mapper
**Location:** `packages/shared/src/explainability.ts`

```typescript
import type { JsonLogicRule, UserProfile } from './types';

export interface MatchExplanation {
  matched_clauses: string[];
  disqualifiers: string[];
  matched_profile_fields: string[];
}

export function explainMatch(rule: JsonLogicRule, profile: UserProfile): MatchExplanation {
  const matched_clauses: string[] = [];
  const disqualifiers: string[] = [];
  const matched_profile_fields: string[] = [];

  explainRule(rule, profile, matched_clauses, disqualifiers, matched_profile_fields);

  return {
    matched_clauses,
    disqualifiers,
    matched_profile_fields,
  };
}

function explainRule(
  rule: JsonLogicRule, 
  profile: UserProfile, 
  matched: string[], 
  disqualified: string[], 
  fields: string[]
): boolean {
  if (typeof rule !== 'object' || rule === null) {
    return !!rule;
  }

  const operator = Object.keys(rule)[0];
  const operand = rule[operator];

  switch (operator) {
    case 'all':
      const allResults = operand.map((r: any) => 
        explainRule(r, profile, matched, disqualified, fields)
      );
      return allResults.every(Boolean);

    case 'any':
      const anyResults = operand.map((r: any) => 
        explainRule(r, profile, matched, disqualified, fields)
      );
      return anyResults.some(Boolean);

    case 'eq':
      const leftVal = getValue(operand[0], profile);
      const rightVal = getValue(operand[1], profile);
      const isMatch = leftVal === rightVal;
      
      if (operand[0].var) {
        fields.push(operand[0].var);
        const explanation = `${formatField(operand[0].var)} matches requirement (${rightVal})`;
        
        if (isMatch) {
          matched.push(explanation);
        } else {
          disqualified.push(`${formatField(operand[0].var)} does not match (current: ${leftVal}, required: ${rightVal})`);
        }
      }
      
      return isMatch;

    case 'in':
      const value = getValue(operand[0], profile);
      const array = getValue(operand[1], profile);
      const inMatch = Array.isArray(array) && array.includes(value);
      
      if (operand[0].var) {
        fields.push(operand[0].var);
        const explanation = `${formatField(operand[0].var)} is in accepted regions/categories`;
        
        if (inMatch) {
          matched.push(explanation);
        } else {
          disqualified.push(`${formatField(operand[0].var)} not in accepted list (current: ${value})`);
        }
      }
      
      return inMatch;

    case 'lte':
      const lteLeft = getValue(operand[0], profile);
      const lteRight = getValue(operand[1], profile);
      const lteMatch = lteLeft <= lteRight;
      
      if (operand[0].var) {
        fields.push(operand[0].var);
        const explanation = `${formatField(operand[0].var)} within threshold (≤ ${lteRight})`;
        
        if (lteMatch) {
          matched.push(explanation);
        } else {
          disqualified.push(`${formatField(operand[0].var)} exceeds threshold (current: ${lteLeft}, max: ${lteRight})`);
        }
      }
      
      return lteMatch;

    default:
      return false;
  }
}

function getValue(operand: any, profile: UserProfile): any {
  if (typeof operand === 'object' && operand.var) {
    const path = operand.var.split('.');
    let current: any = profile;
    for (const key of path) {
      current = current?.[key];
    }
    
    if (operand.var === 'economic.income_bracket_numeric') {
      return incomeToNumeric(current);
    }
    
    return current;
  }
  return operand;
}

function formatField(varPath: string): string {
  const fieldNames: Record<string, string> = {
    'location.province_code': 'Province',
    'location.country_code': 'Country',
    'demographics.citizenship_status': 'Citizenship status',
    'economic.income_bracket_numeric': 'Income level',
    'economic.employment_status': 'Employment status',
    'education_skills.highest_education_level': 'Education level',
    'constraints.max_commute_km': 'Maximum commute distance',
    'goals.primary_goal': 'Primary goal',
  };
  
  return fieldNames[varPath] || varPath;
}

function incomeToNumeric(bracket?: string): number {
  switch (bracket) {
    case 'lt_1000_zar': return 500;
    case '1000_3000_zar': return 2000;
    case '3000_5000_zar': return 4000;
    case '5000_plus_zar': return 7500;
    default: return 0;
  }
}
```

### Task 1.5: Create Curated SA Dataset
**Location:** `packages/ingestion/data/curated/sa_opportunities.json`

```json
[
  {
    "id": "za_sassa_csg_2025",
    "title": "Child Support Grant",
    "category": "grant",
    "organization": "SASSA",
    "regions": ["ZA"],
    "value_amount": 530,
    "value_currency": "ZAR",
    "required_documents": ["ID document", "Child's birth certificate", "Proof of income"],
    "eligibility_rules": [
      {
        "all": [
          {"eq": [{"var": "location.country_code"}, "ZA"]},
          {"eq": [{"var": "demographics.citizenship_status"}, "citizen"]},
          {"lte": [{"var": "economic.income_bracket_numeric"}, 5000]}
        ]
      }
    ],
    "source_url": "https://services.sassa.gov.za",
    "apply_url": "https://services.sassa.gov.za",
    "provenance": {
      "extraction_method": "manual_curated",
      "evidence_links": ["https://services.sassa.gov.za/SassaServices/SocialGrantInformation"],
      "last_seen_at": "2025-09-29T09:00:00Z",
      "last_verified_at": "2025-09-29T09:00:00Z",
      "freshness_score": 1.0
    }
  },
  {
    "id": "za_ct_skills_voucher_2025",
    "title": "City of Cape Town Skills Development Voucher",
    "category": "training",
    "organization": "City of Cape Town",
    "regions": ["ZA-WC"],
    "value_amount": 1500,
    "value_currency": "ZAR",
    "deadline": "2025-12-31T23:59:59Z",
    "required_documents": ["ID copy", "Proof of residence in Cape Town", "Unemployed affidavit"],
    "eligibility_rules": [
      {
        "all": [
          {"eq": [{"var": "location.country_code"}, "ZA"]},
          {"eq": [{"var": "location.province_code"}, "WC"]},
          {"in": [{"var": "economic.employment_status"}, ["unemployed"]]},
          {"lte": [{"var": "economic.income_bracket_numeric"}, 4000]}
        ]
      }
    ],
    "source_url": "https://www.capetown.gov.za/Family%20and%20home/education-and-research-opportunities/adult-education-and-training",
    "provenance": {
      "extraction_method": "manual_curated",
      "evidence_links": ["https://www.capetown.gov.za/Family%20and%20home/education-and-research-opportunities/adult-education-and-training"],
      "last_seen_at": "2025-09-29T09:00:00Z",
      "last_verified_at": "2025-09-29T09:00:00Z",
      "freshness_score": 0.95
    }
  },
  {
    "id": "za_sayouth_general_worker_ct_2025",
    "title": "General Worker - Cape Town",
    "category": "job",
    "organization": "Various Employers",
    "regions": ["ZA-WC-CPT"],
    "required_documents": ["ID copy", "CV"],
    "eligibility_rules": [
      {
        "all": [
          {"eq": [{"var": "location.country_code"}, "ZA"]},
          {"eq": [{"var": "location.province_code"}, "WC"]},
          {"lte": [{"var": "constraints.max_commute_km"}, 15]}
        ]
      }
    ],
    "source_url": "https://www.sayouth.mobi",
    "apply_url": "https://www.sayouth.mobi",
    "provenance": {
      "extraction_method": "manual_curated",
      "evidence_links": ["https://www.sayouth.mobi"],
      "last_seen_at": "2025-09-29T09:00:00Z",
      "last_verified_at": "2025-09-29T09:00:00Z",
      "freshness_score": 0.9
    }
  }
]
```

## Day 5-6: API Implementation

### Task 1.6: Implement Core API Endpoints
**Location:** `apps/api/src/routes/profiles.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserProfileSchema, type UserProfile } from '@cyclebreaker/shared/schema/userProfile';
import { evaluateRule, explainMatch } from '@cyclebreaker/shared/src/eligibility';
import opportunities from '../../../ingestion/data/curated/sa_opportunities.json';

// In-memory storage for MVP (replace with database later)
const profiles = new Map<string, UserProfile>();

export async function createProfile(request: FastifyRequest, reply: FastifyReply) {
  try {
    const profile = UserProfileSchema.parse(request.body);
    profile.id = crypto.randomUUID();
    profile.created_at = new Date().toISOString();
    profile.updated_at = profile.created_at;
    
    profiles.set(profile.id, profile);
    
    return reply.status(201).send({ id: profile.id });
  } catch (error) {
    return reply.status(400).send({ error: 'Invalid profile data' });
  }
}

export async function getFeed(request: FastifyRequest, reply: FastifyReply) {
  const { profile_id } = request.query as { profile_id?: string };
  
  if (!profile_id) {
    return reply.status(400).send({ error: 'profile_id is required' });
  }
  
  const profile = profiles.get(profile_id);
  if (!profile) {
    return reply.status(404).send({ error: 'Profile not found' });
  }
  
  const matches = opportunities
    .filter(opp => {
      return opp.eligibility_rules.every(rule => evaluateRule(rule, profile));
    })
    .map(opp => {
      const explanation = explainMatch(opp.eligibility_rules[0], profile);
      const match_score = calculateMatchScore(opp, profile);
      
      return {
        opportunity: opp,
        match_score,
        why: explanation.matched_clauses,
        matched_profile_fields: explanation.matched_profile_fields,
        disqualifiers: explanation.disqualifiers,
      };
    })
    .sort((a, b) => b.match_score - a.match_score);
  
  return reply.send({ matches });
}

function calculateMatchScore(opportunity: any, profile: UserProfile): number {
  let score = 0.5; // Base score
  
  // Freshness component
  if (opportunity.provenance.freshness_score) {
    score += opportunity.provenance.freshness_score * 0.2;
  }
  
  // Goal alignment
  if (profile.goals?.primary_goal === 'find_job' && opportunity.category === 'job') {
    score += 0.2;
  }
  if (profile.goals?.primary_goal === 'get_grant' && opportunity.category === 'grant') {
    score += 0.2;
  }
  if (profile.goals?.primary_goal === 'get_training' && opportunity.category === 'training') {
    score += 0.2;
  }
  
  // Category preference
  if (profile.goals?.preferred_categories?.includes(opportunity.category)) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}
```

### Task 1.7: Create Basic Web Interface
**Location:** `apps/web/app/onboarding/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserProfileSchema } from '@cyclebreaker/shared/schema/userProfile';
import type { UserProfile } from '@cyclebreaker/shared/schema/userProfile';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<UserProfile>({
    resolver: zodResolver(UserProfileSchema),
    defaultValues: {
      location: { country_code: 'ZA' },
      consent: {
        terms_accepted_at: new Date().toISOString(),
        consent_data_processing: true,
      },
    },
  });

  const onSubmit = async (data: UserProfile) => {
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        setProfileId(result.id);
        localStorage.setItem('cyclebreaker_profile_id', result.id);
        setStep(4);
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome to CycleBreaker SA</h1>
        <p className="mb-4">Find grants, training, and job opportunities matched to your profile.</p>
        <button 
          onClick={() => setStep(2)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded"
        >
          Get Started
        </button>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">Profile Created!</h2>
        <p className="mb-4">Your profile ID: {profileId}</p>
        <a 
          href={`/feed?profile_id=${profileId}`}
          className="w-full bg-green-600 text-white py-2 px-4 rounded block text-center"
        >
          View Your Opportunities
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Tell us about yourself</h2>
      
      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Province</label>
        <select {...register('location.province_code')} className="w-full border rounded px-3 py-2">
          <option value="">Select Province</option>
          <option value="WC">Western Cape</option>
          <option value="GP">Gauteng</option>
          <option value="KZN">KwaZulu-Natal</option>
          <option value="EC">Eastern Cape</option>
          <option value="FS">Free State</option>
          <option value="NW">North West</option>
          <option value="NC">Northern Cape</option>
          <option value="MP">Mpumalanga</option>
          <option value="LP">Limpopo</option>
        </select>
      </div>

      {/* Employment Status */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Employment Status</label>
        <select {...register('economic.employment_status')} className="w-full border rounded px-3 py-2">
          <option value="">Select Status</option>
          <option value="unemployed">Unemployed</option>
          <option value="informal_employed">Informal Work</option>
          <option value="formal_employed">Formal Job</option>
          <option value="student">Student</option>
        </select>
      </div>

      {/* Primary Goal */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">What's your main goal?</label>
        <select {...register('goals.primary_goal')} className="w-full border rounded px-3 py-2">
          <option value="">Select Goal</option>
          <option value="find_job">Find a job</option>
          <option value="get_grant">Get government grants</option>
          <option value="get_training">Get training/skills</option>
          <option value="reduce_costs">Reduce expenses</option>
        </select>
      </div>

      {/* Transport */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">How do you usually travel to work?</label>
        <select {...register('constraints.transport_mode')} className="w-full border rounded px-3 py-2">
          <option value="">Select Transport</option>
          <option value="walk">Walking</option>
          <option value="taxi">Taxi</option>
          <option value="bus">Bus</option>
          <option value="private">Own transport</option>
        </select>
      </div>

      {/* Max Commute */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Maximum distance you can travel (km)</label>
        <input 
          type="number" 
          {...register('constraints.max_commute_km', { valueAsNumber: true })} 
          className="w-full border rounded px-3 py-2"
          placeholder="e.g. 5"
        />
      </div>

      <button 
        type="submit" 
        className="w-full bg-blue-600 text-white py-2 px-4 rounded"
      >
        Create My Profile
      </button>
    </form>
  );
}
```

## Deliverables by End of Week 1

1. **Working schemas** in `packages/shared/schema/` for UserProfile and Opportunity
2. **JSON-logic evaluator** with explainability in `packages/shared/src/eligibility.ts`
3. **Curated SA dataset** with 20+ opportunities with provenance and rules
4. **API endpoints** for POST /profiles and GET /feed with matching logic
5. **Basic web interface** for onboarding and viewing matches
6. **PWA configuration** for offline caching (basic service worker)

## Success Criteria

- [ ] User can complete onboarding and create a profile
- [ ] Feed shows relevant opportunities with "why matched" explanations
- [ ] All opportunities have provenance and last_verified timestamps
- [ ] App works offline for cached profiles and opportunities
- [ ] Admin can verify/update opportunity freshness

## Next Steps (Week 2)

- Add distance/transport penalty calculations
- Build admin verification interface
- Add savings calculators and debt SMS templates
- Implement basic feedback collection

This provides a concrete, actionable plan for your first week of development. Each task builds on the previous one, and by the end you'll have a functional MVP demonstrating the core concept.
