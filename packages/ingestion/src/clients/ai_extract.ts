import { OpportunitySchema, type Opportunity } from '@cyclebreaker/shared'
import { resolveSecret } from '../utils/secrets.js'

const NVIDIA_BASE = (process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '')
const UNLIMITED_BASE = (process.env.UNLIMITED_API_BASE_URL || '').replace(/\/$/, '')

function getUnlimitedKeys(): string[] {
  const list = resolveSecret('UNLIMITED_API_KEYS') || ''
  const single = resolveSecret('UNLIMITED_API_KEY') || ''
  const combined = [list, single].filter(Boolean).join(',')
  return combined
    .split(/[\n,]/)
    .map(s => s.trim())
    .filter(Boolean)
}

async function callNvidia(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, model?: string): Promise<string> {
  const key = resolveSecret('NVIDIA_API_KEY')
  if (!key) throw new Error('Missing NVIDIA_API_KEY')
  const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: model || process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct', messages, temperature: 0.2, max_tokens: 1500 }),
  })
  if (!res.ok) throw new Error(`NVIDIA ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('NVIDIA returned no content')
  return content
}

async function callUnlimited(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, model?: string): Promise<string> {
  const keys = getUnlimitedKeys()
  if (!UNLIMITED_BASE || keys.length === 0) throw new Error('Unlimited not configured')
  const key = keys[Math.floor(Date.now() / 60000) % keys.length]
  const res = await fetch(`${UNLIMITED_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: model || process.env.UNLIMITED_MODEL || 'gpt-4o-mini', messages, temperature: 0.2, max_tokens: 1500 }),
  })
  if (!res.ok) throw new Error(`Unlimited ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('Unlimited returned no content')
  return content
}

export async function extractOpportunityWithAI(html: string, url: string): Promise<Opportunity | null> {
  const system = 'You extract structured opportunity objects for a South African jobs/grants/training finder. Respond ONLY JSON.'
  const user = `From the following HTML snippet and URL, extract one Opportunity JSON matching this TypeScript shape: {id,title,category:"job|training|grant|service",organization?,regions:[string],value_amount?,value_currency?='ZAR',deadline?,required_documents?,eligibility_rules:[any],source_url,apply_url?,provenance:{extraction_method:'manual_curated'|'static_html'|'api',evidence_links?:string[],last_seen_at:string,last_verified_at?:string,freshness_score?:number}}. If unsure, return null.\nURL:${url}\nHTML:\n${html}`

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ] as const

  const providers = [callNvidia, callUnlimited]
  const errors: string[] = []
  for (const p of providers) {
    try {
      const content = await p(messages as any)
      const text = (content || '').trim().replace(/^```json\s*|\s*```$/g, '')
      const parsed = JSON.parse(text)
      const result = OpportunitySchema.safeParse(parsed)
      if (result.success) return result.data
      return null
    } catch (e: any) {
      errors.push(String(e?.message || e))
    }
  }
  return null
}
