import { createHash } from 'node:crypto'
import { request } from 'undici'

export async function fetchText(url: string): Promise<string> {
  const res = await request(url, {
    method: 'GET',
    headers: {
      'user-agent': 'CycleBreakerBot/0.1 (+https://example.local)'
    }
  })
  if (res.statusCode >= 400) throw new Error(`HTTP ${res.statusCode} for ${url}`)
  return await res.body.text()
}

export function hashContent(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

