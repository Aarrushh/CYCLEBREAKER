import { resolveSecret } from '../utils/secrets.js'

const API_KEY = resolveSecret('NVIDIA_API_KEY')
const BASE_URL = (process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '')

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function nvidiaChat(messages: ChatMessage[], opts?: { model?: string; temperature?: number; max_tokens?: number }) {
  if (!API_KEY) throw new Error('Missing NVIDIA_API_KEY')
  const model = opts?.model || 'meta/llama-3.1-70b-instruct'
  const body: any = {
    model,
    messages,
    temperature: opts?.temperature ?? 0.2,
    max_tokens: opts?.max_tokens ?? 512,
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`NVIDIA API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data?.choices?.[0]?.message?.content as string | undefined
}
