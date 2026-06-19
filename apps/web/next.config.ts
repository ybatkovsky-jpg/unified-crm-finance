import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone build для Docker (см. apps/web/Dockerfile)
  output: 'standalone',
  experimental: {
    // Server Actions для мутаций (будет использоваться в S3+)
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Заголовки безопасности (см. docs/15-security-rbac.md)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
