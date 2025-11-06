import { OpportunitySchema, type Opportunity } from '@cyclebreaker/shared'

const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY
const PARALLEL_BASE_URL = (process.env.PARALLEL_BASE_URL || '').replace(/\/$/, '')

// Optional integration hook for a search aggregation provider ("Parallel").
// This expects an OpenAI-compatible or custom REST endpoint that accepts query arrays
// and returns a list of URLs. If not configured, this is a no-op.
export async function searchWithParallel(queries: string[]): Promise<string[]> {
  if (!PARALLEL_API_KEY || !PARALLEL_BASE_URL || !queries.length) return []
  try {
    const res = await fetch(`${PARALLEL_BASE_URL}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${PARALLEL_API_KEY}` },
      body: JSON.stringify({ queries }),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (Array.isArray(data)) return data.filter((u) => typeof u === 'string')
    if (Array.isArray(data?.urls)) return data.urls.filter((u: any) => typeof u === 'string')
    return []
  } catch {
    return []
  }
}

