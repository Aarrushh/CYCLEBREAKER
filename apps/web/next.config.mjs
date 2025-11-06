import path from 'node:path'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure workspace packages are transpiled (TS/ESM) for the web app
  transpilePackages: ["@cyclebreaker/shared"],
  // Force monorepo root for output tracing to avoid picking up external lockfiles
  outputFileTracingRoot: path.resolve(process.cwd(), '../../'),
}

export default nextConfig

