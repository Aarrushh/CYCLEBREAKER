#!/usr/bin/env node
import 'dotenv/config'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { runDiscovery } from '../src/runner'

async function main() {
  const region = (process.argv[2] as 'ZA') || 'ZA'
  const locality = process.argv[3]
  const outDir = join(process.cwd(), 'data/ingested')
  mkdirSync(outDir, { recursive: true })
  const results = await runDiscovery({ region, locality, maxPerSite: 3 })
  const file = join(outDir, `${region.toLowerCase()}-${Date.now()}.json`)
  writeFileSync(file, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`Wrote ${results.length} records to ${file}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

