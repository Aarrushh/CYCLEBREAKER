import { OpportunitySchema, type Opportunity } from '@cyclebreaker/shared'
import { resolveSecret } from '../utils/secrets.js'

const DEEPSEEK_API_KEY = resolveSecret('DEEPSEEK_API_KEY')

export async function extractOpportunityWithDeepSeek(html: string, url: string): Promise<Opportunity | null> {
  if (!DEEPSEEK_API_KEY) return null
  // Placeholder: integrate with DeepSeek for extraction
  // Return null until wired up
  return null
}

export async function generateQueriesWithDeepSeek(profile: any): Promise<string[]> {
  if (!DEEPSEEK_API_KEY) return []
  // Placeholder: call DeepSeek to generate localized queries for SA
  return []
}

