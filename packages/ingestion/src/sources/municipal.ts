import { load } from 'cheerio'
import { Adapter, makeSimpleService } from './types'

async function discoverMunicipal() {
  return [
    'https://www.westerncape.gov.za/dept/health',
    'https://www.capetown.gov.za/City-Services/Health',
  ]
}

async function parseMunicipal(html: string, url: string) {
  const $ = load(html)
  const title = $('title').first().text().trim() || 'Municipal Health Services'
  const summary = $('meta[name="description"]').attr('content')?.trim() || 'Municipal health and community services information.'
  return makeSimpleService(title, url, summary, ['health', 'service'])
}

export const municipalAdapters: Adapter[] = [
  {
    name: 'municipal-health',
    discover: async () => discoverMunicipal(),
    parse: async (html, url) => parseMunicipal(html, url),
  },
]

