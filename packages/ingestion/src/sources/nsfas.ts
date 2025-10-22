import { load } from 'cheerio'
import { Adapter, makeSimpleService } from './types'

async function discoverNsfas() {
  return [
    'https://www.nsfas.org.za/',
  ]
}

async function parseNsfas(html: string, url: string) {
  const $ = load(html)
  const title = $('title').first().text().trim() || 'NSFAS'
  const summary = $('meta[name="description"]').attr('content')?.trim() || 'NSFAS funding information and deadlines.'
  return makeSimpleService(title, url, summary, ['education', 'grants'])
}

export const nsfasAdapters: Adapter[] = [
  {
    name: 'nsfas-home',
    discover: async () => discoverNsfas(),
    parse: async (html, url) => parseNsfas(html, url),
  },
]
