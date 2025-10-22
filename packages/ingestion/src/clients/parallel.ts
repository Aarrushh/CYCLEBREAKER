import { OpportunitySchema, type Opportunity } from '@cyclebreaker/shared'

const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY

export async function searchWithParallel(queries: string[]): Promise<string[]> {
  if (!PARALLEL_API_KEY) return []
  // Placeholder: integrate with Parallel API when ready
  // For now, just return empty list; wire this to your Parallel API client
  return []
}

