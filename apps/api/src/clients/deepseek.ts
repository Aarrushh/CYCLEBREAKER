import 'dotenv/config'

const API_KEY = process.env.DEEPSEEK_API_KEY!
const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1'
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

if (!API_KEY) {
  console.warn('[DeepSeek] DEEPSEEK_API_KEY not set; /profiles/sort will be disabled.')
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function deepseekChat(messages: ChatMessage[], opts?: { response_format?: 'json' }) {
  if (!API_KEY) throw new Error('Missing DEEPSEEK_API_KEY')
  const url = `${API_BASE.replace(/\/$/, '')}/chat/completions`
  const body: any = {
    model: MODEL,
    messages,
    // Some providers support response_format; if DeepSeek differs, set via env
    ...(opts?.response_format === 'json' ? { response_format: { type: 'json_object' } } : {}),
    temperature: 0.2,
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DeepSeek error ${res.status}: ${text}`)
  }
  const data = await res.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('DeepSeek returned no content')
  return content
}

