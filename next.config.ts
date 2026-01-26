import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Mark cheerio as external package for server components
  // This prevents bundling issues with native modules
  serverExternalPackages: ['cheerio'],
}

export default nextConfig
