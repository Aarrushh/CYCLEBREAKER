import { z } from 'zod';

// SA-specific provinces for validation
export const SA_PROVINCES = [
  'WC', // Western Cape
  'GP', // Gauteng
  'KZN', // KwaZulu-Natal
  'EC', // Eastern Cape
  'FS', // Free State
  'NW', // North West
  'NC', // Northern Cape
  'MP', // Mpumalanga
  'LP', // Limpopo
] as const;

// SA official languages
export const SA_LANGUAGES = [
  'en', 'af', 'zu', 'xh', 'st', 'nso', 'tn', 've', 'ts', 'ss', 'nr'
] as const;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  
  location: z.object({
    country_code: z.literal('ZA'),
    province_code: z.enum(SA_PROVINCES).optional(),
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
    language_prefs: z.array(z.enum(SA_LANGUAGES)).optional(),
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

// Helper to get numeric age bracket midpoint
export const ageBracketToNumeric = (bracket?: string): number => {
  switch (bracket) {
    case '16_17': return 16.5;
    case '18_24': return 21;
    case '25_34': return 29.5;
    case '35_49': return 42;
    case '50_plus': return 55;
    default: return 30;
  }
};

