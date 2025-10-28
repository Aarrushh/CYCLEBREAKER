#!/usr/bin/env node
import { execSync } from 'node:child_process'

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' })
}

const msg = process.argv.slice(2).join(' ').trim() || 'chore: quick commit'

try {
  run('git add -A')
  run(`git commit -m ${JSON.stringify(msg)}`)
  // post-commit hook will auto-push; also push here for CI or if hook disabled
  run('git push')
} catch (err) {
  process.exitCode = 1
}
