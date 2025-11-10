import { z } from 'zod'

// Hazard severity taxonomy
export const HazardSeveritySchema = z.enum(['info', 'warning', 'critical'])
export type HazardSeverity = z.infer<typeof HazardSeveritySchema>

export const LenderHazardSchema = z.object({
  flag: z.string(),
  severity: HazardSeveritySchema,
  message: z.string().optional(),
  impact_on_apr: z.number().optional(),
  action: z.enum(['educate', 'alert', 'refer']).optional(),
  link: z.string().url().optional(),
})
export type LenderHazard = z.infer<typeof LenderHazardSchema>

export const FeeSchema = z.object({
  type: z.enum(['initiation', 'service', 'collection', 'insurance', 'rollover', 'other']),
  amount: z.number().nonnegative(),
  frequency: z.enum(['once', 'monthly', 'weekly']),
})
export type Fee = z.infer<typeof FeeSchema>

export const PaymentSchema = z.object({ amount: z.number().nonnegative() })
export type Payment = z.infer<typeof PaymentSchema>

export const DebtSchema = z.object({
  id: z.string(),
  lenderName: z.string().optional(),
  lenderType: z.enum(['mashonisa', 'micro_lender', 'retail_store_card', 'credit_card', 'payday', 'other']).default('other'),
  principal: z.number().positive(),
  rateValue: z.number().nonnegative().optional(), // numeric percent, e.g., 25 for 25%
  ratePeriod: z.enum(['per_year', 'per_month', 'per_week', 'flat_total']).optional(),
  compounding: z.enum(['annual', 'monthly', 'weekly', 'none']).optional(),
  termMonths: z.number().int().positive().optional(),
  minPayment: z.number().nonnegative().optional(),
  fees: z.array(FeeSchema).optional(),
  totalRepay: z.number().positive().optional(), // for flat-total cases
  paymentSchedule: z.array(PaymentSchema).optional(), // for flat-total IRR cases (monthly)
  ncrCategory: z.enum(['unsecured', 'short_term_first', 'short_term_subsequent', 'incidental', 'mortgage', 'credit_facility', 'unknown']).default('unknown').optional(),
  ncrRegistered: z.boolean().nullable().optional(),
  collateral: z
    .object({
      idRetained: z.boolean().optional(),
      bankCardRetained: z.boolean().optional(),
      asset: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
})
export type Debt = z.infer<typeof DebtSchema>

export const RegionContextSchema = z.object({
  province: z.string().optional(),
  municipality: z.string().optional(),
  typicalTransportCostDaily: z.number().nonnegative().optional(),
  inflationAssumptionAnnual: z.number().nonnegative().optional(),
  sourceTags: z.array(z.string()).optional(),
})
export type RegionContext = z.infer<typeof RegionContextSchema>

export const OrderedDebtSchema = z.object({
  debtId: z.string(),
  effectiveAPR: z.number(),
  minPayment: z.number(),
  extraPaymentApplied: z.number(),
})
export type OrderedDebt = z.infer<typeof OrderedDebtSchema>

export const ScheduleItemSchema = z.object({
  debtId: z.string(),
  payment: z.number(),
  interest: z.number(),
  principal: z.number(),
  remaining: z.number(),
})
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>

export const MonthlyScheduleSchema = z.object({
  monthIndex: z.number().int().nonnegative(),
  items: z.array(ScheduleItemSchema),
})
export type MonthlySchedule = z.infer<typeof MonthlyScheduleSchema>

export const DebtPlanSchema = z.object({
  orderedDebts: z.array(OrderedDebtSchema),
  monthlySchedule: z.array(MonthlyScheduleSchema),
  monthsToFreedom: z.number().int().nonnegative(),
  projectedInterestPaid: z.number().nonnegative(),
  interestSavedVsMinOnly: z.number().nonnegative(),
})
export type DebtPlan = z.infer<typeof DebtPlanSchema>

export const SummaryCardSchema = z.object({ id: z.string(), title: z.string(), lines: z.array(z.string()) })
export type SummaryCard = z.infer<typeof SummaryCardSchema>

export const SupportResourceSchema = z.object({
  org: z.string(),
  service: z.string(),
  contact: z.string(),
  url: z.string().url(),
  toll_free: z.boolean().optional(),
  languages: z.array(z.string()).optional(),
})
export type SupportResource = z.infer<typeof SupportResourceSchema>

export const DebtAnalyzePreferencesSchema = z.object({
  strategy: z.enum(['avalanche', 'avalanche_small_win_weighted']).default('avalanche'),
  smallWinWeight: z.number().min(0).max(1).default(0.3).optional(),
})
export type DebtAnalyzePreferences = z.infer<typeof DebtAnalyzePreferencesSchema>

export const DebtAnalyzeRequestSchema = z.object({
  debts: z.array(DebtSchema).min(1),
  monthlyBudget: z.number().positive().optional(),
  preferences: DebtAnalyzePreferencesSchema.optional(),
  regionContext: RegionContextSchema.optional(),
  aiSummary: z.boolean().optional(),
})
export type DebtAnalyzeRequest = z.infer<typeof DebtAnalyzeRequestSchema>

export const DebtAnalyzeResponseSchema = z.object({
  plan: DebtPlanSchema,
  explanations: z.array(z.string()),
  hazards: z.array(
    z.object({ debtId: z.string(), hazards: z.array(LenderHazardSchema) })
  ),
  summaryCards: z.array(SummaryCardSchema),
  ai: z
    .object({ enabled: z.boolean(), segments: z.array(z.object({ title: z.string(), bullets: z.array(z.string()) })) })
    .optional(),
  supportResources: z.array(SupportResourceSchema).optional(),
})
export type DebtAnalyzeResponse = z.infer<typeof DebtAnalyzeResponseSchema>

export const NegotiationTemplateRequestSchema = z.object({
  lenderType: z.enum(['mashonisa', 'micro_lender', 'retail_store_card', 'credit_card', 'payday', 'other']).default('other'),
  arrearsState: z.enum(['current', '7_30_days', '31_90_days', '90_plus']).default('current'),
  goal: z.enum(['reduce_interest', 'payment_plan', 'fee_waiver', 'dispute']).default('payment_plan'),
  tone: z.enum(['formal', 'direct', 'polite']).default('polite').optional(),
  language: z.enum(['en', 'zu', 'xh', 'af']).default('en').optional(),
})
export type NegotiationTemplateRequest = z.infer<typeof NegotiationTemplateRequestSchema>

export const NegotiationTemplateResponseSchema = z.object({
  templates: z.array(
    z.object({ channel: z.enum(['sms', 'whatsapp', 'email']), message: z.string(), notes: z.string().optional() })
  ),
})
export type NegotiationTemplateResponse = z.infer<typeof NegotiationTemplateResponseSchema>

export const ReportLenderRequestSchema = z.object({
  lenderName: z.string().optional(),
  lenderType: z.string(),
  issue: z.string(),
  severity: z.enum(['low', 'med', 'high']).default('low'),
  location: z
    .object({ province: z.string().optional(), municipality: z.string().optional() })
    .optional(),
  visibility: z.literal('private').default('private'),
})
export type ReportLenderRequest = z.infer<typeof ReportLenderRequestSchema>

export const ReportLenderResponseSchema = z.object({ status: z.literal('stored'), referenceId: z.string() })
export type ReportLenderResponse = z.infer<typeof ReportLenderResponseSchema>

// Renegotiation request/response (MVP helper)
export const RenegotiateRequestSchema = z.object({
  debt_id: z.string(),
  proposed_terms: z
    .object({
      new_monthly_payment: z.number().positive().optional(),
      new_term_months: z.number().int().positive().optional(),
      payment_holiday_months: z.number().int().min(1).max(6).optional(),
    })
    .refine((o) => Object.keys(o).length > 0, { message: 'At least one proposed term is required' }),
  reasoning: z.string(),
  urgency: z.enum(['routine', 'hardship']).default('routine'),
})
export type RenegotiateRequest = z.infer<typeof RenegotiateRequestSchema>

export const RenegotiateResponseSchema = z.object({
  success: z.boolean(),
  lender_contact_channels: z.array(z.enum(['sms', 'email', 'phone', 'in_person'])),
  template: z.object({ primary: z.string(), fallback: z.array(z.string()) }),
  expected_response_time: z.string(),
  next_steps: z.array(z.string()),
})
export type RenegotiateResponse = z.infer<typeof RenegotiateResponseSchema>

// Dispute filing (MVP link-out)
export const DisputeRequestSchema = z.object({
  debt_id: z.string(),
  reason: z.enum(['incorrect_amount', 'predatory_terms', 'early_payment_penalty', 'other']).default('other'),
  evidence: z
    .object({
      loan_document_url: z.string().url().optional(),
      payment_proof_urls: z.array(z.string().url()).optional(),
      correspondence: z.string().optional(),
    })
    .optional(),
})
export type DisputeRequest = z.infer<typeof DisputeRequestSchema>

export const DisputeResponseSchema = z.object({
  status: z.literal('filed'),
  ncr_reference_number: z.string().optional(),
  advice: z.string(),
  resources: z.object({
    ncr_complaint_portal: z.string().url(),
    legal_aid_contact: z.string(),
    debt_counselor_locator: z.string().url(),
  }),
})
export type DisputeResponse = z.infer<typeof DisputeResponseSchema>

// Constants: NCR max rates (as decimals per annum where applicable)
export const NCR_MAX_RATES = {
  unsecured: 0.285,
  short_term_first: 0.05 * 12, // convert monthly cap to annual equivalent
  short_term_subsequent: 0.03 * 12,
  incidental: 0.02 * 12,
  mortgage: 0.195,
  credit_facility: 0.215,
} as const

export type NcrCategory = keyof typeof NCR_MAX_RATES
