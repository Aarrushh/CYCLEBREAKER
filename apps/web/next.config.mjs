/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure workspace packages are transpiled (TS/ESM) for the web app
  transpilePackages: ["@cyclebreaker/shared"],
}

export default nextConfig

