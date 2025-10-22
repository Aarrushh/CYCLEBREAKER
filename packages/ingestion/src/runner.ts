import { setTimeout as delay } from 'node:timers/promises'
import { fetchText } from './net/fetcher'
import { searchWithParallel } from './clients/parallel'
import { extractOpportunityWithDeepSeek } from './clients/deepseek'
import { sassaAdapters } from './sources/sassa'
import { nsfasAdapters } from './sources/nsfas'
import { municipalAdapters } from './sources/municipal'
import { jobAdapters } from './sources/jobs'
import type { Opportunity } from '@cyclebreaker/shared'

export type DiscoveryOptions = {
  region: 'ZA'
  locality?: string
  queries?: string[]
  maxPerSite?: number
}

export async function runDiscovery(opts: DiscoveryOptions): Promise<Opportunity[]> {
  const allAdapters = [
    ...sassaAdapters,
    ...nsfasAdapters,
    ...municipalAdapters,
    ...jobAdapters,
  ]

  const results: Opportunity[] = []

  // 1) Adapter seed URLs (high precision)
  for (const adapter of allAdapters) {
    try {
      const seedUrls = await adapter.discover({ locality: opts.locality })
      for (const url of seedUrls.slice(0, opts.maxPerSite ?? 5)) {
        const html = await fetchText(url)
        const opp = await adapter.parse(html, url)
        if (opp) results.push(opp)
        await delay(200)
      }
    } catch (e) {
      // noop: adapters are best-effort
    }
  }

  // 2) Parallel-backed search (breadth; optional if no API key)
  try {
    const q = opts.queries?.length ? opts.queries : [
      'SASSA grant payment calendar site:sassa.gov.za',
      'NSFAS deadlines site:nsfas.org.za',
      'clinic hours site:westerncape.gov.za',
      'learnership site:sayouth.mobi',
    ]
    const urls = await searchWithParallel(q)
    for (const url of urls.slice(0, 20)) {
      const html = await fetchText(url)
      const opp = await extractOpportunityWithDeepSeek(html, url)
      if (opp) results.push(opp)
      await delay(200)
    }
  } catch (e) {
    // ignore if key missing or provider unavailable
  }

  return results
}

