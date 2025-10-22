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
    type: 'service',
    title,
    summary,
    url,
    categories,
    jurisdiction: { countries: ['ZA'], regions: [], localities: [] },
    requiredDocuments: [],
    applicationSteps: [],
    explainability: { whyMatched: [] },
  }
}

