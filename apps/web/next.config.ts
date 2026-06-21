import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Explicitly set the root directory for Turbopack
  // This prevents issues when there are multiple lockfiles in parent directories
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
