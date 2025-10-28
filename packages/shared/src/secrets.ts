import fs from 'node:fs'

/**
 * Resolve a secret using multiple indirection strategies without ever logging it.
 * Priority:
 * 1) DIRECT: NAME
 * 2) REF: NAME_REF=env:OTHER_ENV_NAME
 * 3) FILE: NAME_FILE=absolute-or-relative-path
 */
export function resolveSecret(name: string): string | undefined {
  // 1) Direct
  let val = process.env[name]
  if (val && val.trim().length > 0) return val.trim()

  // 2) Indirection via REF (e.g., NVIDIA_API_KEY_REF=env:CB_SECRET_NVIDIA_API_KEY)
  const ref = process.env[`${name}_REF`]
  if (ref) {
    const [kind, refName] = ref.split(':', 2)
    if (kind === 'env' && refName) {
      const v = process.env[refName]
      if (v && v.trim().length > 0) return v.trim()
    }
  }

  // 3) File-based secret (e.g., NVIDIA_API_KEY_FILE=C:\\secrets\\nvidia.txt)
  const filePath = process.env[`${name}_FILE`]
  if (filePath) {
    try {
      const v = fs.readFileSync(filePath, 'utf8')
      if (v && v.trim().length > 0) return v.trim()
    } catch {
      // Do not throw here; just fall through and return undefined
    }
  }

  return undefined
}

export function requireSecret(name: string): string {
  const v = resolveSecret(name)
  if (!v) throw new Error(`Missing secret: ${name}`)
  return v
}

export function getEnv(name: string, fallback?: string): string | undefined {
  const v = process.env[name]
  return v !== undefined ? v : fallback
}
