import fs from 'node:fs'

export function resolveSecret(name: string): string | undefined {
  let val = process.env[name]
  if (val && val.trim().length > 0) return val.trim()

  const ref = process.env[`${name}_REF`]
  if (ref) {
    const [kind, refName] = ref.split(':', 2)
    if (kind === 'env' && refName) {
      const v = process.env[refName]
      if (v && v.trim().length > 0) return v.trim()
    }
  }

  const filePath = process.env[`${name}_FILE`]
  if (filePath) {
    try {
      const v = fs.readFileSync(filePath, 'utf8')
      if (v && v.trim().length > 0) return v.trim()
    } catch {
      // swallow
    }
  }

  return undefined
}
