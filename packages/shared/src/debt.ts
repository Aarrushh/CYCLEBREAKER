import { z } from 'zod'
import {
  Debt,
  DebtAnalyzeRequest,
  DebtAnalyzeResponse,
  DebtAnalyzeRequestSchema,
  LenderHazard,
  HazardSeveritySchema,
  NCR_MAX_RATES,
  NegotiationTemplateRequest,
  NegotiationTemplateResponse,
  SummaryCard,
} from './models.js'

// Small utility to clamp
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

// Convert weekly rate (percent) to annual APR decimal
function weeklyToAnnual(weeklyPct: number): number {
  const r = weeklyPct / 100
  return Math.pow(1 + r, 52) - 1
}

// Convert annual percent and compounding to monthly decimal rate
function toMonthlyRate(rateValuePct = 0, ratePeriod: string | undefined, compounding: string | undefined): number {
  const r = rateValuePct / 100
  if (ratePeriod === 'per_month') return r
  if (ratePeriod === 'per_week') return Math.pow(1 + r, 52 / 12) - 1
  // default per_year / unknown
  if (compounding === 'monthly') return Math.pow(1 + r, 1 / 12) - 1
  return r / 12
}

// IRR (monthly) from cash flows [-principal, p1, p2, ...]
function irrMonthly(cashFlows: number[], guess = 0.1): number {
  let rate = guess
  for (let i = 0; i < 100; i++) {
    let npv = 0
    let d = 0
    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t]
      const denom = Math.pow(1 + rate, t)
      npv += cf / denom
      d += -t * cf / Math.pow(1 + rate, t + 1)
    }
    const newRate = rate - npv / d
    if (!isFinite(newRate)) break
    if (Math.abs(newRate - rate) < 1e-7) return newRate
    rate = newRate
  }
  return rate
}

function monthlyFeesZar(debt: Debt): number {
  let monthly = 0
  const fees = debt.fees || []
  for (const f of fees) {
    if (f.frequency === 'monthly') monthly += f.amount
    else if (f.frequency === 'weekly') monthly += f.amount * 4.333
    // 'once' handled via amortization in APR approximation
  }
  return monthly
}

function oneTimeFeesZar(debt: Debt): number {
  const fees = debt.fees || []
  return fees.filter((f) => f.frequency === 'once').reduce((s, f) => s + f.amount, 0)
}

export type AprComputation = { apr: number; method: 'weekly_compounding' | 'flat_total_irr' | 'amortizing'; notes: string[] }

export function computeEffectiveAPR(debt: Debt): AprComputation {
  const notes: string[] = []
  // Case 1: weekly compounding or weekly period
  if (debt.compounding === 'weekly' || debt.ratePeriod === 'per_week') {
    const apr = weeklyToAnnual(debt.rateValue ?? 0)
    notes.push(`Weekly rate ${(debt.rateValue ?? 0).toFixed(2)}% → APR ${(apr * 100).toFixed(1)}%`)
    return { apr, method: 'weekly_compounding', notes }
  }

  // Case 2: flat-total with provided schedule or totalRepay
  if (debt.ratePeriod === 'flat_total' && (debt.paymentSchedule?.length || (debt.totalRepay && debt.termMonths))) {
    const schedule = debt.paymentSchedule?.map((p) => p.amount) ||
      Array.from({ length: debt.termMonths || 0 }, () => (debt.totalRepay! / (debt.termMonths || 1)))
    const cfs = [-debt.principal, ...schedule]
    const rMonthly = irrMonthly(cfs)
    const apr = Math.pow(1 + rMonthly, 12) - 1
    notes.push(`Flat-total IRR on ${schedule.length} payments → monthly ${(rMonthly * 100).toFixed(2)}% → APR ${(apr * 100).toFixed(1)}%`)
    return { apr, method: 'flat_total_irr', notes }
  }

  // Case 3: standard amortizing with fees approximation
  const rMonthly = toMonthlyRate(debt.rateValue ?? 0, debt.ratePeriod, debt.compounding)
  const monthlyFee = monthlyFeesZar(debt)
  const term = Math.max(1, debt.termMonths || 12)
  const oneTime = oneTimeFeesZar(debt)
  // Approximate by adding fee/principal as rate uplift
  const feeUplift = monthlyFee / Math.max(1, debt.principal) + oneTime / Math.max(1, debt.principal * term)
  const effectiveMonthly = Math.max(0, rMonthly + feeUplift)
  const apr = Math.pow(1 + effectiveMonthly, 12) - 1
  notes.push(`Monthly rate ${(rMonthly * 100).toFixed(2)}% + fee uplift ${(feeUplift * 100).toFixed(2)}% → APR ${(apr * 100).toFixed(1)}%`)
  return { apr, method: 'amortizing', notes }
}

export function detectHazards(debt: Debt, apr: number): LenderHazard[] {
  const hazards: LenderHazard[] = []
  const add = (h: LenderHazard) => hazards.push(h)

  const weekly = debt.compounding === 'weekly' || debt.ratePeriod === 'per_week'
  if (weekly) {
    add({ flag: 'weekly_compounding', severity: 'warning', impact_on_apr: Math.round(apr * 100), action: 'educate', message: 'Weekly compounding is expensive vs. monthly/annual' })
  }

  const hasRoll = (debt.fees || []).some((f) => f.type === 'rollover')
  if (hasRoll) add({ flag: 'rollover_fees', severity: 'warning', action: 'alert', message: 'Rollover fees increase total cost significantly' })

  const hasInsurance = (debt.fees || []).some((f) => f.type === 'insurance')
  if (hasInsurance) add({ flag: 'insurance_bundled', severity: 'info', action: 'educate', message: 'Insurance premiums may be optional—ask for opt-out' })

  const initFeePct = (debt.fees || []).filter((f) => f.type === 'initiation' && f.frequency === 'once').reduce((s, f) => s + f.amount, 0) / Math.max(1, debt.principal)
  if (initFeePct > 0.1) add({ flag: 'advance_fees', severity: 'warning', action: 'alert', message: `High initiation fees (~${Math.round(initFeePct * 100)}% of principal)` })

  if (debt.collateral?.idRetained || debt.collateral?.bankCardRetained) {
    add({ flag: 'id_or_card_retention', severity: 'critical', action: 'refer', message: 'Lender keeping ID or bank card is unsafe—seek help' })
  }

  if (debt.ncrRegistered === false || debt.ncrRegistered == null) {
    add({ flag: 'unknown_ncr_registration', severity: 'warning', action: 'educate', message: 'Lender registration not verified with NCR' })
  }

  if (debt.ncrCategory && (debt.ncrCategory as any) in NCR_MAX_RATES) {
    const cap = (NCR_MAX_RATES as any)[debt.ncrCategory]
    if (cap != null && apr > cap * 1.001) add({ flag: 'exceeds_ncr_cap', severity: 'critical', action: 'refer', message: `APR ${(apr * 100).toFixed(1)}% exceeds NCR cap ${(cap * 100).toFixed(1)}%` })
  }

  if (debt.ratePeriod === 'flat_total' && !debt.paymentSchedule && !debt.totalRepay) {
    add({ flag: 'missing_disclosure', severity: 'warning', action: 'educate', message: 'Flat-total indicated but no schedule/total repay provided' })
  }

  // Balloon detection
  if (debt.paymentSchedule && debt.paymentSchedule.length > 1) {
    const pays = debt.paymentSchedule.map((p) => p.amount)
    const final = pays[pays.length - 1]
    const avg = pays.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(1, pays.length - 1)
    if (final > avg * 1.5) add({ flag: 'balloon_payment', severity: 'warning', action: 'alert', message: `Final payment R${final.toFixed(2)} is ${(100 * (final / Math.max(1, avg) - 1)).toFixed(0)}% larger` })
  }

  return hazards
}

function defaultMinPayment(principal: number): number {
  return Math.max(50, Math.round(principal * 0.02))
}

export function simulatePlan(input: DebtAnalyzeRequest, aprMap: Record<string, number>) {
  const debts = input.debts.map((d) => ({
    ...d,
    remaining: d.principal,
    monthlyRate: toMonthlyRate(d.rateValue ?? 0, d.ratePeriod, d.compounding),
    monthlyFee: monthlyFeesZar(d),
    minPay: d.minPayment ?? defaultMinPayment(d.principal),
    apr: aprMap[d.id] ?? 0,
  }))

  // Order by effective APR (avalanche) with optional small-win balancing
  const smallWin = input.preferences?.smallWinWeight ?? 0
  debts.sort((a, b) => {
    const aprRank = b.apr - a.apr
    if (!smallWin) return aprRank
    const balRank = a.remaining - b.remaining // smaller balance first
    return aprRank * (1 - smallWin) + balRank * (smallWin / Math.max(1, Math.abs(balRank)))
  })

  const monthlyBudget = input.monthlyBudget ?? debts.reduce((s, d) => s + d.minPay, 0)
  const orderedDebts = debts.map((d, i) => ({ debtId: d.id, effectiveAPR: d.apr, minPayment: d.minPay, extraPaymentApplied: 0 }))

  const schedule: { monthIndex: number; items: { debtId: string; payment: number; interest: number; principal: number; remaining: number }[] }[] = []
  let month = 0
  let projectedInterest = 0
  const MAX_MONTHS = 360

  while (month < MAX_MONTHS) {
    const items: { debtId: string; payment: number; interest: number; principal: number; remaining: number }[] = []
    // pick current target = first with remaining > 0
    const target = debts.find((d) => d.remaining > 0)
    if (!target) break

    let surplus = monthlyBudget
    for (const d of debts) {
      if (d.remaining <= 0) continue
      const interest = d.remaining * d.monthlyRate + d.monthlyFee
      let payment = Math.min(d.minPay, d.remaining + interest)
      surplus -= payment
      let principalPaid = Math.max(0, payment - interest)
      d.remaining = Math.max(0, d.remaining - principalPaid)
      projectedInterest += Math.max(0, interest)
      items.push({ debtId: d.id, payment, interest: Math.max(0, interest), principal: principalPaid, remaining: d.remaining })
    }

    // apply surplus to target
    if (surplus > 0 && target.remaining > 0) {
      const interest = target.remaining * target.monthlyRate // additional interest next cycle not included here
      const extra = Math.min(surplus, target.remaining)
      target.remaining = Math.max(0, target.remaining - extra)
      const idx = items.findIndex((it) => it.debtId === target.id)
      if (idx >= 0) {
        items[idx].payment += extra
        items[idx].principal += extra
        items[idx].remaining = target.remaining
      } else {
        items.push({ debtId: target.id, payment: extra, interest: 0, principal: extra, remaining: target.remaining })
      }
      const od = orderedDebts.find((o) => o.debtId === target.id)
      if (od) od.extraPaymentApplied += extra
    }

    schedule.push({ monthIndex: month, items })
    month++
  }

  const monthsToFreedom = month
  // Baseline (min-only) rough interest estimate
  const baselineInterest = debts.reduce((s, d) => s + d.principal * d.monthlyRate * Math.min(12, d.termMonths || 12), 0)
  const interestSavedVsMinOnly = Math.max(0, baselineInterest - projectedInterest)

  return { orderedDebts, schedule, monthsToFreedom, projectedInterest, interestSavedVsMinOnly }
}

function buildSummaryCards(aprMap: Record<string, number>, hazards: { debtId: string; hazards: LenderHazard[] }[], monthsToFreedom: number): SummaryCard[] {
  const avgApr = Object.values(aprMap).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(aprMap).length)
  const riskFlags = hazards.flatMap((h) => h.hazards).filter((h) => h.severity !== 'info')
  return [
    { id: 'apr', title: 'Effective APRs', lines: [`Average APR: ${(avgApr * 100).toFixed(1)}%`, `Highest APR first saves interest`] },
    { id: 'hazards', title: 'Hazards detected', lines: riskFlags.slice(0, 5).map((h) => `${h.flag} (${h.severity})`) },
    { id: 'timeline', title: 'Time to freedom', lines: [`Estimated: ${monthsToFreedom} months`]},
  ]
}

export function analyzeDebts(input: DebtAnalyzeRequest): DebtAnalyzeResponse {
  const parsed = DebtAnalyzeRequestSchema.parse(input)

  // Compute APR per debt + hazards
  const aprMap: Record<string, number> = {}
  const explanations: string[] = []
  const hazards: { debtId: string; hazards: LenderHazard[] }[] = []

  for (const d of parsed.debts) {
    const comp = computeEffectiveAPR(d)
    aprMap[d.id] = comp.apr
    explanations.push(...comp.notes.map((n) => `${d.id}: ${n}`))
    const hz = detectHazards(d, comp.apr)
    hazards.push({ debtId: d.id, hazards: hz })
  }

  // Simulate payoff plan
  const sim = simulatePlan(parsed, aprMap)

  // Support resources if many critical hazards
  const criticalCount = hazards.reduce((s, h) => s + h.hazards.filter((x) => x.severity === 'critical').length, 0)
  const supportResources = criticalCount >= 2 ? [
    { org: 'Black Sash', service: 'Debt Counseling & Legal Aid', contact: '0800 30 59 59', url: 'https://www.blacksash.org.za/', toll_free: true, languages: ['en', 'zu', 'xh', 'af'] },
    { org: 'NCR', service: 'Debt Counselor Locator & Complaints', contact: 'https://www.ncr.org.za/consumers/debt-counselling/find-debt-counselor', url: 'https://www.ncr.org.za/' },
  ] : undefined

  const summaryCards = buildSummaryCards(aprMap, hazards, sim.monthsToFreedom)

  return {
    plan: {
      orderedDebts: sim.orderedDebts,
      monthlySchedule: sim.schedule,
      monthsToFreedom: sim.monthsToFreedom,
      projectedInterestPaid: sim.projectedInterest,
      interestSavedVsMinOnly: sim.interestSavedVsMinOnly,
    },
    explanations,
    hazards,
    summaryCards,
    ...(supportResources ? { supportResources } : {}),
  }
}

export function negotiationTemplates(req: NegotiationTemplateRequest): NegotiationTemplateResponse {
  const tonePrefix = req.tone === 'formal' ? 'Good day' : req.tone === 'direct' ? 'Hello' : 'Hi'
  const base = `${tonePrefix}, I would like to discuss my account. Due to hardship, I propose a more affordable plan.`
  const goalMap: Record<string, string> = {
    reduce_interest: 'Please consider a reduced interest rate so I can stay on track.',
    payment_plan: 'I propose a lower monthly payment for the next 3 months, with review after.',
    fee_waiver: 'Please waive initiation/late fees to make repayment possible.',
    dispute: 'I would like to dispute certain charges and request a statement breakdown.',
  }
  const arrearsNote = req.arrearsState === 'current' ? '' : req.arrearsState === '7_30_days' ? ' I am up to 30 days behind.' : req.arrearsState === '31_90_days' ? ' I am 31–90 days behind.' : ' I am over 90 days behind and need urgent help.'

  const message = `${base}${arrearsNote} ${goalMap[req.goal]}`.trim()
  return {
    templates: [
      { channel: 'sms', message },
      { channel: 'whatsapp', message, notes: req.lenderType === 'mashonisa' ? 'Be polite and prioritize safety in any in-person contact.' : undefined },
      { channel: 'email', message: `${message}\n\nRegards,` },
    ],
  }
}
