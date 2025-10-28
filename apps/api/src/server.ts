import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import crypto from 'node:crypto'
import { nvidiaChat } from './clients/nvidia.js'

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

