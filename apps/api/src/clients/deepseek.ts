import 'dotenv/config'
import { resolveSecret } from '../utils/secrets.js'

const DS_API_KEY = resolveSecret('DEEPSEEK_API_KEY')
const DS_API_BASE = (process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1').replace(/\/$/, '')
const DS_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

const OA_KEY = resolveSecret('OPENAI_COMPAT_API_KEY') || resolveSecret('UNLIMITED_API_KEY')
const OA_BASE = (process.env.OPENAI_COMPAT_BASE_URL || process.env.UNLIMITED_API_BASE_URL || '').replace(/\/$/, '')
const OA_MODEL = process.env.OPENAI_COMPAT_MODEL || process.env.UNLIMITED_MODEL || 'gpt-4o-mini'

if (!DS_API_KEY && !OA_KEY) {
  console.warn('[AI] No DEEPSEEK_API_KEY or OPENAI_COMPAT_API_KEY; /profiles/sort will be disabled.')
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function deepseekChat(messages: ChatMessage[], opts?: { response_format?: 'json' }) {
  const providers: Array<{ base: string; key?: string; model: string; name: string }> = []
  if (DS_API_KEY) providers.push({ base: DS_API_BASE, key: DS_API_KEY, model: DS_MODEL, name: 'deepseek' })
  if (OA_KEY && OA_BASE) providers.push({ base: OA_BASE, key: OA_KEY, model: OA_MODEL, name: 'openai-compat' })
  if (!providers.length) throw new Error('No AI provider configured')

  const lastErrors: string[] = []
  for (const p of providers) {
    try {
      const url = `${p.base}/chat/completions`
      const body: any = {
        model: p.model,
        messages,
        ...(opts?.response_format === 'json' ? { response_format: { type: 'json_object' } } : {}),
        temperature: 0.2,
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${p.key}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`${p.name} ${res.status}: ${await res.text()}`)
      const data = await res.json()
      const content: string | undefined = data?.choices?.[0]?.message?.content
      if (!content) throw new Error(`${p.name} returned no content`)
      return content
    } catch (e: any) {
      lastErrors.push(String(e?.message || e))
    }
  }
  throw new Error(lastErrors.join(' | '))
}

