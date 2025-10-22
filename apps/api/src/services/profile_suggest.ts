import { z } from 'zod'
import { deepseekChat } from '../clients/deepseek.js'
import { UserProfileSchema, type UserProfile } from '@cyclebreaker/shared'

const OutputSchema = UserProfileSchema

const SYSTEM_PROMPT = `You are a helpful assistant that converts free-text life context into a structured, privacy-respecting user profile for a recommendation app in South Africa.
- Output ONLY valid JSON matching the provided schema.
- Do not invent PII (like IDs). Keep optional fields empty if not provided.
- Prefer concise arrays for skills and languages.
- location.country should be a 2-letter ISO code when obvious (e.g., ZA for South Africa).
- Default radiusKm to something small (e.g., 5) if not specified.
`

export async function suggestUserProfile(input: string): Promise<UserProfile> {
  const user = `Create a user profile JSON from this description.\n\nDescription:\n${input}\n\nReturn ONLY JSON. Do not include any extra text.`
  const content = await deepseekChat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ], { response_format: 'json' })

  // Some models return code fences; strip if present
  const jsonText = content.trim().replace(/^```json\s*|\s*```$/g, '')
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (e) {
    throw new Error('Model did not return valid JSON')
  }
  const result = OutputSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error('Generated profile did not match schema: ' + result.error.message)
  }
  return result.data
}

