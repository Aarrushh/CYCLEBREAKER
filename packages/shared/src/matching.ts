export type GeoPoint = { lat: number; lon: number }

export type TransportMode = 'walk' | 'minibus_taxi' | 'bus' | 'train' | 'ridehailing'

export type TransportQuote = {
  mode: TransportMode
  distanceKm: number
  durationMin: number
  costZar: number
  withinBudget: boolean
}

export type Candidate = {
  id: string
  location: GeoPoint
  skills: string[]
  expectedSalaryZar?: number
  maxCommuteMin?: number
  commuteBudgetZar?: number
  preferredModes?: TransportMode[]
  jobTypePrefs?: string[]
  shiftPrefs?: string[]
}

export type Job = {
  id: string
  title?: string
  location: GeoPoint
  skillsRequired: string[]
  salaryZar?: number
  jobType?: string
  shift?: string
  transportStipendZar?: number
  remote?: boolean
  hybrid?: boolean
}

export type MatchWeights = {
  skill: number
  transport: number
  compensation: number
  preferences: number
}

export type MatchOptions = {
  topK?: number
  minSkillCoverage?: number
  weights?: MatchWeights
  transportParams?: Partial<typeof DEFAULT_TRANSPORT_PARAMS>
  explain?: boolean
}

export type MatchComponentScores = {
  skill: number
  transport: number
  compensation: number
  preferences: number
}

export type RankingResult = {
  job: Job
  total: number
  components: MatchComponentScores
  transport: TransportQuote | null
  reasons?: string[]
}

const DEFAULT_TRANSPORT_PARAMS = {
  walk:        { speedKmh: 4.5,  costPerKm: 0,    baseZar: 0 },
  minibus_taxi:{ speedKmh: 25,   costPerKm: 2.5,  baseZar: 10 },
  bus:         { speedKmh: 22,   costPerKm: 2.0,  baseZar: 8 },
  train:       { speedKmh: 35,   costPerKm: 1.5,  baseZar: 10 },
  ridehailing: { speedKmh: 27,   costPerKm: 8.5,  baseZar: 12 },
} as const

const DEFAULT_WEIGHTS: MatchWeights = {
  skill: 0.4,
  transport: 0.3,
  compensation: 0.2,
  preferences: 0.1,
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

function overlapPref(a?: string[], bItem?: string): number {
  if (!a || !a.length || !bItem) return 0.5
  return a.map((x) => x.toLowerCase()).includes(bItem.toLowerCase()) ? 1 : 0
}

export function estimateTransportQuotes(
  candidate: Candidate,
  job: Job,
  paramsOverride?: Partial<typeof DEFAULT_TRANSPORT_PARAMS>
): TransportQuote[] {
  const params = { ...DEFAULT_TRANSPORT_PARAMS, ...(paramsOverride || {}) }
  const distanceKm = haversineKm(candidate.location, job.location)
  const modes = candidate.preferredModes?.length
    ? candidate.preferredModes
    : (['walk', 'minibus_taxi', 'bus', 'train'] as TransportMode[])
  const stipend = job.transportStipendZar ?? 0
  const quotes: TransportQuote[] = modes.map((mode) => {
    const p = (params as any)[mode]
    const durationMin = (distanceKm / p.speedKmh) * 60
    const grossCost = p.baseZar + p.costPerKm * distanceKm
    const costZar = Math.max(0, grossCost - stipend)
    const withinBudget =
      candidate.commuteBudgetZar == null ? true : costZar <= candidate.commuteBudgetZar
    return { mode, distanceKm, durationMin, costZar, withinBudget }
  })
  const inBudget = quotes.filter((q) => q.withinBudget)
  const sorted = (inBudget.length ? inBudget : quotes).sort((a, b) =>
    a.durationMin === b.durationMin ? a.costZar - b.costZar : a.durationMin - b.durationMin
  )
  return sorted
}

export function isEligible(
  candidate: Candidate,
  job: Job,
  opts?: MatchOptions,
  chosen?: TransportQuote | null
): { ok: boolean; reasons: string[]; skillCoverage: number } {
  const reasons: string[] = []
  const minSkillCoverage = opts?.minSkillCoverage ?? 0.5
  const req = job.skillsRequired || []
  const have = candidate.skills || []
  const matchCount = req.filter((r) => have.map((h) => h.toLowerCase()).includes(r.toLowerCase())).length
  const coverage = req.length === 0 ? 1 : matchCount / req.length
  if (coverage < minSkillCoverage) {
    reasons.push(
      `Insufficient skill coverage (${(coverage * 100).toFixed(0)}% < ${(minSkillCoverage * 100).toFixed(0)}%)`
    )
  }
  const isRemoteOrHybrid = !!job.remote || !!job.hybrid
  if (!isRemoteOrHybrid && chosen) {
    if (candidate.maxCommuteMin != null && chosen.durationMin > candidate.maxCommuteMin) {
      reasons.push(`Commute time too long (${chosen.durationMin.toFixed(0)} min > ${candidate.maxCommuteMin} min)`)
    }
    if (candidate.commuteBudgetZar != null && !chosen.withinBudget) {
      reasons.push(
        `Commute cost exceeds budget (R${chosen.costZar.toFixed(2)} > R${candidate.commuteBudgetZar?.toFixed(2)})`
      )
    }
  }
  return { ok: reasons.length === 0, reasons, skillCoverage: coverage }
}

function transportScore(candidate: Candidate, quote: TransportQuote | null): number {
  if (!quote) return 0.6
  const tMax = candidate.maxCommuteMin ?? 90
  const bMax = candidate.commuteBudgetZar ?? 9999
  const timePart = clamp01(1 - quote.durationMin / tMax)
  const costPart = clamp01(1 - quote.costZar / bMax)
  return 0.5 * timePart + 0.5 * costPart
}

function compensationScore(candidate: Candidate, job: Job): number {
  const expect = candidate.expectedSalaryZar
  const offer = job.salaryZar
  if (!offer && !expect) return 0.6
  if (offer && !expect) return clamp01(Math.log10(1 + offer) / 5)
  if (!offer && expect) return 0.4
  if (!offer || !expect) return 0.5
  if (offer >= expect)
    return clamp01(0.6 + Math.min(0.4, (offer - expect) / Math.max(1000, expect)))
  return clamp01(offer / expect)
}

function preferencesScore(candidate: Candidate, job: Job): number {
  const jt = overlapPref(candidate.jobTypePrefs, job.jobType)
  const sh = overlapPref(candidate.shiftPrefs, job.shift)
  return 0.5 * jt + 0.5 * sh
}

function skillScore(coverage: number): number {
  return clamp01(coverage)
}

export async function rankJobsForCandidate(
  candidate: Candidate,
  jobs: Job[],
  options?: MatchOptions
): Promise<RankingResult[]> {
  const weights = options?.weights ?? DEFAULT_WEIGHTS
  const results: RankingResult[] = []
  for (const job of jobs) {
    const isRemoteOrHybrid = !!job.remote || !!job.hybrid
    const quotes = isRemoteOrHybrid ? [] : estimateTransportQuotes(candidate, job, options?.transportParams)
    const chosen = isRemoteOrHybrid ? null : quotes[0] ?? null
    const elig = isEligible(candidate, job, options, chosen)
    const components: MatchComponentScores = {
      skill: skillScore(elig.skillCoverage),
      transport: transportScore(candidate, chosen),
      compensation: compensationScore(candidate, job),
      preferences: preferencesScore(candidate, job),
    }
    let total =
      weights.skill * components.skill +
      weights.transport * components.transport +
      weights.compensation * components.compensation +
      weights.preferences * components.preferences
    if (!elig.ok) total *= 0.5
    const reasons = options?.explain
      ? [
          `Skill coverage ${(elig.skillCoverage * 100).toFixed(0)}%`,
          chosen
            ? `Transport(${chosen.mode}) ~${chosen.durationMin.toFixed(0)}min / R${chosen.costZar.toFixed(2)}`
            : job.remote
            ? 'Remote role'
            : job.hybrid
            ? 'Hybrid role'
            : 'Transport N/A',
          job.salaryZar ? `Offer R${job.salaryZar}` : 'Offer TBD',
          job.jobType ? `Type ${job.jobType}` : 'Type N/A',
          ...elig.reasons.map((r) => `Note: ${r}`),
        ]
      : undefined
    results.push({ job, total: clamp01(total), components, transport: chosen, reasons })
  }
  results.sort((a, b) => b.total - a.total)
  const topK = options?.topK ?? 20
  return results.slice(0, topK)
}