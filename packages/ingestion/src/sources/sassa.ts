import { load } from 'cheerio'
import type { Adapter } from './types.js'
import { makeSimpleService } from './types.js'

async function discoverCalendars() {
  // Seed URLs - update with any known stable pages
  return [
    'https://www.sassa.gov.za/Pages/SASSA-SRD-Payment-Dates.aspx',
  ]
}

async function parseSassa(html: string, url: string) {
  const $ = load(html)
  const title = $('title').first().text().trim() || 'SASSA Information'
  const summary = $('meta[name="description"]').attr('content')?.trim() || 'SASSA grant information and payment dates.'
  return makeSimpleService(title, url, summary, ['benefit', 'grants'])
}

export const sassaAdapters: Adapter[] = [
  {
    name: 'sassa-calendars',
    discover: async () => discoverCalendars(),
    parse: async (html: string, url: string) => parseSassa(html, url),
  },
]

