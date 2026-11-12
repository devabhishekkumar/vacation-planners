import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
export default function config(phase: string): NextConfig {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
    async redirects() {
      return [{ source: '/crm/:path*', destination: '/admin/:path*', permanent: true }];
    },
    images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
  };
}
