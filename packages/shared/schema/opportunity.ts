import { z } from 'zod';

// JSON-logic rule type - allows any valid JSON-logic structure
export type JsonLogicRule = any;

export const OpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['job', 'training', 'grant', 'service']),
  organization: z.string().optional(),
  
  // SA-specific region codes: ZA, ZA-WC, ZA-WC-CPT, etc.
  regions: z.array(z.string()),
  
  value_amount: z.number().optional(),
  value_currency: z.literal('ZAR').optional(),
  deadline: z.string().datetime().optional(),
  
  required_documents: z.array(z.string()).optional(),
  // JSON-logic eligibility rules array
  eligibility_rules: z.array(z.any()),
  
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

// Match result type for API responses
export const MatchResultSchema = z.object({
  opportunity: OpportunitySchema,
  match_score: z.number().min(0).max(1),
  why: z.array(z.string()),
  matched_profile_fields: z.array(z.string()),
  disqualifiers: z.array(z.string()).optional(),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;

