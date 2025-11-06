import { OpportunitySchema, type Opportunity } from '@cyclebreaker/shared'
import { resolveSecret } from '../utils/secrets.js'

const DEEPSEEK_API_KEY = resolveSecret('DEEPSEEK_API_KEY')
const DEEPSEEK_API_BASE = (process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1').replace(/\/$/, '')

// OpenAI-compatible fallback (e.g., Lao Zhang free chat or other provider)
const OA_COMPAT_API_KEY = resolveSecret('OPENAI_COMPAT_API_KEY') || resolveSecret('UNLIMITED_API_KEY')
const OA_COMPAT_BASE = (process.env.OPENAI_COMPAT_BASE_URL || process.env.UNLIMITED_API_BASE_URL || '').replace(/\/$/, '')

async function chatJSON(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, opts?: { model?: string }): Promise<string> {
  const tryProviders: Array<{ base: string; key?: string; model?: string }> = []
  if (DEEPSEEK_API_KEY) tryProviders.push({ base: DEEPSEEK_API_BASE, key: DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL || 'deepseek-chat' })
  if (OA_COMPAT_API_KEY && OA_COMPAT_BASE) tryProviders.push({ base: OA_COMPAT_BASE, key: OA_COMPAT_API_KEY, model: process.env.OPENAI_COMPAT_MODEL || 'gpt-4o-mini' })

  let lastErr: any
  for (const p of tryProviders) {
    try {
      const res = await fetch(`${p.base}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${p.key}` },
        body: JSON.stringify({ model: opts?.model || p.model, messages, temperature: 0.2 })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content
      if (!content) throw new Error('no content')
      return content as string
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('no provider available')
}

export async function extractOpportunityWithDeepSeek(html: string, url: string): Promise<Opportunity | null> {
  if (!DEEPSEEK_API_KEY && !(OA_COMPAT_API_KEY && OA_COMPAT_BASE)) return null
  const system = 'You extract structured opportunity objects for a South African jobs/grants/training finder. Respond ONLY JSON.'
  const user = `From the following HTML snippet and URL, extract one Opportunity JSON matching this TypeScript shape: {id,title,category:"job|training|grant|service",organization?,regions:[string],value_amount?,value_currency?='ZAR',deadline?,required_documents?,eligibility_rules:[any],source_url,apply_url?,provenance:{extraction_method:'manual_curated'|'static_html'|'api',evidence_links?:string[],last_seen_at:string,last_verified_at?:string,freshness_score?:number}}. If unsure, return null.\nURL:${url}\nHTML:\n${html}`
  try {
    const content = await chatJSON([
      { role: 'system', content: system },
      { role: 'user', content: user }
    ], {})
    const text = (content || '').trim().replace(/^```json\s*|\s*```$/g, '')
    const parsed = JSON.parse(text)
    const result = OpportunitySchema.safeParse(parsed)
    if (result.success) return result.data
    return null
  } catch {
    return null
  }
}

export async function generateQueriesWithDeepSeek(profile: any): Promise<string[]> {
  if (!DEEPSEEK_API_KEY && !(OA_COMPAT_API_KEY && OA_COMPAT_BASE)) return []
  const system = 'You generate short, localized search queries for South African opportunities (jobs/training/grants). Return a JSON array of 3-6 strings.'
  const user = `Profile context (JSON):\n${JSON.stringify(profile).slice(0, 4000)}`
  try {
    const content = await chatJSON([
      { role: 'system', content: system },
      { role: 'user', content: user }
    ])
    const text = (content || '').trim().replace(/^```json\s*|\s*```$/g, '')
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed.filter((x: any) => typeof x === 'string').slice(0, 8) : []
  } catch {
    return []
  }
}

