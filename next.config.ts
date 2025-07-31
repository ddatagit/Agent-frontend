import type { NextConfig } from 'next'

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  webpack(config: any) { // 👈 quick fix (or see better version below)
    config.resolve.fullySpecified = false
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:async_hooks': 'async_hooks',
    }
    return config
  },
}

export default nextConfig
