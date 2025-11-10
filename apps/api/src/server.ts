import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import crypto from 'node:crypto'
import { nvidiaChat } from './clients/nvidia.js'
import { resolveSecret } from './utils/secrets.js'
import { suggestUserProfile } from './services/profile_suggest.js'
import { rankJobsForCandidate, type Candidate, type Job } from '@cyclebreaker/shared'

const PORT = Number(process.env.PORT || 4000)

// Simple haversine distance in km
function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (x: number) => (x * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Basic SA minibus-taxi cost model (rough heuristic)
function estimateTaxiCostZAR(distanceKm: number): number {
  const base = 10
  const perKm = 3.5
  return Math.round((base + perKm * distanceKm) * 100) / 100
}

async function geocode(text: string): Promise<{ lat: number; lon: number } | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', text)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  const res = await fetch(url.toString(), {
    headers: { 'user-agent': 'CycleBreaker/0.1 (transport-cost)' },
  })
  if (!res.ok) return null
  const data = (await res.json()) as Array<any>
  if (!data?.[0]) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

// Load curated opportunities for basic feed
const curated = JSON.parse(
  await readFile(new URL('../../../packages/ingestion/data/curated/sa_opportunities.json', import.meta.url), 'utf-8')
) as any[]

// In-memory profiles for MVP
const profiles = new Map<string, any>()

export async function buildServer() {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: true })

  app.get('/health', async () => ({ ok: true }))

  // Basic PII redaction helper (do not log sensitive patterns)
  function redactPII(s: string): string {
    return String(s)
      .replace(/\b\d{13}\b/g, '[ID_NUMBER]')
      .replace(/\b27\d{9,}\b/g, '[PHONE]')
      .replace(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[EMAIL]')
      .replace(/sk-[A-Za-z0-9]{20,}/g, '[API_KEY]')
  }

  // Debt analysis endpoints (MVP)
  try {
    const {
      DebtAnalyzeRequestSchema,
      analyzeDebts,
      NegotiationTemplateRequestSchema,
      negotiationTemplates,
      ReportLenderRequestSchema,
      SummaryCardSchema,
    } = await import('@cyclebreaker/shared')

    // Analyze debts → plan + hazards + summary cards
    app.post('/debt/analyze', async (req, reply) => {
      try {
        const body = DebtAnalyzeRequestSchema.parse(req.body || {})
        const result = analyzeDebts(body)
        return reply.send(result)
      } catch (e: any) {
        req.log.error({ err: redactPII(e?.message || 'error') })
        return reply.code(400).send({ error: 'VALIDATION_ERROR', details: redactPII(e?.message || 'invalid') })
      }
    })

    // Negotiation templates
    app.post('/debt/templates/negotiation', async (req, reply) => {
      try {
        const body = NegotiationTemplateRequestSchema.parse(req.body || {})
        const result = negotiationTemplates(body)
        return reply.send(result)
      } catch (e: any) {
        req.log.error({ err: redactPII(e?.message || 'error') })
        return reply.code(400).send({ error: 'VALIDATION_ERROR', details: redactPII(e?.message || 'invalid') })
      }
    })

    // Private report lender (no public exposure)
    const reports = new Map<string, any>()
    app.post('/debt/report-lender', async (req, reply) => {
      try {
        const body = ReportLenderRequestSchema.parse(req.body || {})
        const ref = crypto.randomUUID()
        // Store minimally with redaction; ephemeral in-memory for MVP
        reports.set(ref, { ...body, issue: '[REDACTED]', stored_at: new Date().toISOString() })
        return reply.code(202).send({ status: 'stored', referenceId: ref })
      } catch (e: any) {
        req.log.error({ err: redactPII(e?.message || 'error') })
        return reply.code(400).send({ error: 'VALIDATION_ERROR', details: redactPII(e?.message || 'invalid') })
      }
    })

    // Community guidance: stokvel (static MVP content)
    app.get('/community/guidance/stokvel', async (_req, reply) => {
      const checklist = [
        { id: 'constitution', text: 'Written constitution with member sign-off', rationale: 'Sets rules & dispute process' },
        { id: 'bank_account', text: 'Dedicated bank account (dual signatories)', rationale: 'Transparency & protection' },
        { id: 'monthly_meetings', text: 'Monthly or fortnightly meetings', rationale: 'Peer accountability' },
        { id: 'transparent_records', text: 'Treasurer shares monthly statements', rationale: 'Detect issues early' },
      ]
      const articles = [
        { id: 'stokvel_101', title: 'What is a Stokvel?', body: 'Community savings with rotation payouts.', language: 'en', tags: ['stokvel'] },
      ]
      return reply.send({ articles, checklist: { items: checklist }, disclaimer: 'No endorsements. Educational content only.' })
    })

    // Placeholder organizations (no endorsements)
    app.get('/community/orgs/placeholder', async (_req, reply) => {
      const organizations = [
        { id: 'nasasa', name: 'NASASA', category: 'stokvel_association', coverage: 'national', contact: { website: 'https://www.nasasa.co.za/' }, vetted: false, disclaimer: 'Placeholder; not vetted or endorsed.' },
        { id: 'blacksash', name: 'Black Sash', category: 'consumer_protection', coverage: 'national', contact: { website: 'https://www.blacksash.org.za/' }, vetted: false, disclaimer: 'Placeholder; not vetted or endorsed.' },
      ]
      return reply.send({ organizations, disclaimer: 'Informational only. Verify independently.' })
    })

    // Debt renegotiation helper (template + channels)
    const { RenegotiateRequestSchema, RenegotiateResponseSchema, DisputeRequestSchema, DisputeResponseSchema } = await import('@cyclebreaker/shared')
    app.post('/debt/renegotiate', async (req, reply) => {
      try {
        const body = RenegotiateRequestSchema.parse(req.body || {})
        const primary = 'sms'
        const template = `Good day, due to hardship I propose ${body.proposed_terms.new_monthly_payment ? 'a new monthly payment of R' + body.proposed_terms.new_monthly_payment : 'adjusted terms'}. Kindly confirm.`
        const resp = {
          success: true,
          lender_contact_channels: ['sms', 'email'],
          template: { primary, fallback: ['email'] },
          expected_response_time: 'Within 5 working days',
          next_steps: ['Keep proof of messages', 'If no response, consider NCR complaint portal'],
        }
        return reply.send(resp)
      } catch (e: any) {
        req.log.error({ err: redactPII(e?.message || 'error') })
        return reply.code(400).send({ error: 'VALIDATION_ERROR', details: redactPII(e?.message || 'invalid') })
      }
    })

    // Dispute filing (link-out)
    app.post('/debt/dispute', async (req, reply) => {
      try {
        const body = DisputeRequestSchema.parse(req.body || {})
        const resp = {
          status: 'filed',
          advice: 'Prepare documents and submit complaint to NCR; consider Legal Aid if unresolved.',
          resources: {
            ncr_complaint_portal: 'https://www.ncr.org.za/consumers/complaints-and-disputes',
            legal_aid_contact: 'https://www.legal-aid.org.za/',
            debt_counselor_locator: 'https://www.ncr.org.za/consumers/debt-counselling/find-debt-counselor',
          },
        }
        return reply.send(resp)
      } catch (e: any) {
        req.log.error({ err: redactPII(e?.message || 'error') })
        return reply.code(400).send({ error: 'VALIDATION_ERROR', details: redactPII(e?.message || 'invalid') })
      }
    })
  } catch (e: any) {
    app.log.warn({ msg: 'Debt endpoints not available', err: e?.message })
  }

  // Minimal profile endpoints (MVP)
  const CreateProfileBodySchema = z.object({}).passthrough()
  app.post('/profiles', async (req, reply) => {
    const parsed = CreateProfileBodySchema.parse(req.body || {})
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const profile = { ...parsed, id, created_at: now, updated_at: now }
    profiles.set(id, profile)
    return reply.code(201).send({ id })
  })

  // AI onboarding (optional: returns 501 if key not configured)
  app.post('/profiles/sort', async (req, reply) => {
    try {
      if (!resolveSecret('NVIDIA_API_KEY') && !resolveSecret('UNLIMITED_API_KEYS') && !resolveSecret('UNLIMITED_API_KEY')) {
        return reply.code(501).send({ error: 'AI onboarding disabled (configure NVIDIA_API_KEY or UNLIMITED_API_KEYS)' })
      }
      const body = (req.body ?? {}) as any
      const input = String(body.input || '')
      if (!input || input.length < 10) return reply.code(400).send({ error: 'input is required' })
      const profile = await suggestUserProfile(input)
      return { profile }
    } catch (e: any) {
      req.log.error(e)
      return reply.code(500).send({ error: e?.message || 'failed to suggest profile' })
    }
  })

  app.get('/feed', async (req, reply) => {
    const hasFreshness = (o: any) => o?.provenance?.freshness_score ?? 0
    const list = curated.slice().sort((a, b) => (hasFreshness(b) - hasFreshness(a)))
    return { matches: list.map((o: any) => ({ opportunity: o, match_score: hasFreshness(o) || 0.5, why: [], matched_profile_fields: [] })) }
  })

  // Transport cost calculation (MVP: Haversine + taxi heuristic; optional geocoding)
  app.post('/api/transport/calculate', async (req, reply) => {
    const body = (req.body ?? {}) as any
    const parsePoint = async (p: any) => {
      if (!p) return null
      if (typeof p === 'string') return await geocode(p)
      if (typeof p.lat === 'number' && typeof p.lon === 'number') return { lat: p.lat, lon: p.lon }
      if (typeof p.latitude === 'number' && typeof p.longitude === 'number') return { lat: p.latitude, lon: p.longitude }
      return null
    }
    const origin = await parsePoint(body.origin)
    const dest = await parsePoint(body.destination)
    if (!origin || !dest) return reply.code(400).send({ error: 'Invalid origin/destination' })

    const distance_km = haversineKm(origin, dest)
    const taxi_cost_zar = estimateTaxiCostZAR(distance_km)
    return { origin, destination: dest, distance_km, taxi_cost_zar, model: 'mvp_haversine+taxi_v1' }
  })

  // Rank jobs for candidate (transport-aware matching)
  app.post('/api/match', async (req, reply) => {
    const { candidate, jobs, options } = (req.body ?? {}) as { candidate: Candidate; jobs: Job[]; options?: any }
    if (!candidate || !Array.isArray(jobs)) return reply.code(400).send({ error: 'candidate and jobs are required' })
    try {
      const results = await rankJobsForCandidate(candidate, jobs, { ...(options || {}), explain: true })
      return { results }
    } catch (e: any) {
      req.log.error(e)
      return reply.code(500).send({ error: e?.message || 'failed to rank' })
    }
  })

  // Jobs filtered by commute cost (client supplies jobs for now)
  app.post('/api/jobs/transport-filtered', async (req, reply) => {
    const body = (req.body ?? {}) as any
    const jobs: Array<{ id: string; title: string; location: { lat: number; lon: number } }> = body.jobs || []
    const origin = body.origin as { lat: number; lon: number } | undefined
    const max_cost = typeof body.max_cost_zar === 'number' ? body.max_cost_zar : 30
    if (!origin) return reply.code(400).send({ error: 'origin required' })

    const results = jobs.map((j) => {
      const distance_km = haversineKm(origin, j.location)
      const taxi_cost_zar = estimateTaxiCostZAR(distance_km)
      return { ...j, distance_km, taxi_cost_zar }
    }).filter(j => j.taxi_cost_zar <= max_cost)

    return { count: results.length, jobs: results }
  })

  // AI: analyze a job posting for scam indicators via NVIDIA
  app.post('/api/ai/analyze-posting', async (req, reply) => {
    const body = (req.body ?? {}) as any
    const { title = '', description = '', organization = '' } = body
    if (!title && !description) return reply.code(400).send({ error: 'title or description required' })

    const system = 'You analyze job postings for scam risk in South Africa. Respond with a strict JSON object.'
    const user = `Analyze this job posting for scam indicators and return JSON: {risk_score:0-1,risk_level:\"low|medium|high\",flags:string[],confidence:0-1,explanation:string}.\nTitle:${title}\nOrganization:${organization}\nDescription:${description}`
    const content = await nvidiaChat([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], { model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct', temperature: 0.2, max_tokens: 300 })

    const text = (content || '').trim().replace(/^```json\s*|\s*```$/g, '')
    try {
      const parsed = JSON.parse(text)
      return parsed
    } catch {
      return { risk_score: 0.3, risk_level: 'low', flags: [], confidence: 0.4, explanation: 'Fallback: could not parse model output' }
    }
  })

  // Integration helpers (read-only, linkouts)
  app.get('/api/integration/sayouth', async () => ({
    url: 'https://sayouth.mobi',
    toll_free: '0800 727272',
    note: 'Zero-rated site; use official portal for applications. No scraping of dynamic content.'
  }))

  app.get('/api/integration/essa', async () => ({
    url: 'https://essa.labour.gov.za/EssaOnline/WebBeans/',
    note: 'Official Department of Labour job seeker portal. Provide guidance and checklists only.'
  }))

  return app
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer().then((app) => app.listen({ port: PORT, host: '0.0.0.0' }))
}

