import { load } from 'cheerio'
import type { Adapter } from './types.js'
import { makeSimpleService } from './types.js'

async function discoverJobs() {
  return [
    'https://www.sweepsouth.com/',
    'https://jobjack.co.za/',
    'https://sayouth.mobi/Home/Index',
  ]
}

async function parseJobs(html: string, url: string) {
  const $ = load(html)
  const title = $('title').first().text().trim() || 'Entry-level jobs and gigs'
  const summary = $('meta[name="description"]').attr('content')?.trim() || 'Local gigs and entry-level jobs.'
  return makeSimpleService(title, url, summary, ['jobs'])
}

export const jobAdapters: Adapter[] = [
  {
    name: 'jobs-portals',
    discover: async () => discoverJobs(),
    parse: async (html: string, url: string) => parseJobs(html, url),
  },
]

