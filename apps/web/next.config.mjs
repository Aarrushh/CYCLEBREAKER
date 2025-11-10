import path from 'node:path'
import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cyclebreaker/shared"],
  outputFileTracingRoot: path.resolve(process.cwd(), '../../'),
}

const nextConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})(baseConfig)

export default nextConfig
