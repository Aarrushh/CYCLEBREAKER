export type Adapter = {
  name: string
  discover: (opts: { locality?: string }) => Promise<string[]>
  parse: (html: string, url: string) => Promise<import('@cyclebreaker/shared').Opportunity | null>
}

export function makeSimpleService(
  title: string,
  url: string,
  summary: string,
  categories: string[] = ['service']
): import('@cyclebreaker/shared').Opportunity {
  return {
    id: `za_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`,
    title,
    category: 'service',
    organization: 'Various',
    regions: ['ZA'],
    required_documents: [],
    eligibility_rules: [{ all: [{ eq: [{ var: 'location.country_code' }, 'ZA'] }] }],
    source_url: url,
    provenance: {
      extraction_method: 'static_html',
      last_seen_at: new Date().toISOString(),
      freshness_score: 0.5,
    },
  } as import('@cyclebreaker/shared').Opportunity
}

