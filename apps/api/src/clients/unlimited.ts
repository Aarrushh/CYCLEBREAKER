import 'dotenv/config'
import { resolveSecret } from '../utils/secrets.js'

const BASE_URL = (process.env.UNLIMITED_API_BASE_URL || '').replace(/\/$/, '')

function getUnlimitedKeys(): string[] {
  const list = resolveSecret('UNLIMITED_API_KEYS') || ''
  const single = resolveSecret('UNLIMITED_API_KEY') || ''
  const combined = [list, single].filter(Boolean).join(',')
  return combined
    .split(/[\n,]/)
    .map(s => s.trim())
    .filter(Boolean)
}

function pickKey(keys: string[]): string {
  if (!keys.length) throw new Error('Missing UNLIMITED_API_KEY(S)')
  // naive rotate by time to spread usage
  const idx = Math.floor(Date.now() / 60000) % keys.length
  return keys[idx]
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function unlimitedChat(messages: ChatMessage[], opts?: { model?: string; temperature?: number; max_tokens?: number }) {
  if (!BASE_URL) throw new Error('UNLIMITED_API_BASE_URL is required')
  const apiKey = pickKey(getUnlimitedKeys())
  const model = opts?.model || process.env.UNLIMITED_MODEL || 'gpt-4o-mini' // generic default; adjust per provider

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
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Unlimited provider error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data?.choices?.[0]?.message?.content as string | undefined
}
