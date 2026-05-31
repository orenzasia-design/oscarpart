/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    // Gunakan environment variable dari Railway, fallback ke URL production
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://oscarpart-production.up.railway.app/api/v1',
    NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME || 'OSCARPART',
  },
  images: {
    domains: ['files.oscarpart.id', 'localhost'],
  },
  // Hapus rewrites karena frontend dan backend terpisah
  async rewrites() {
    return [];
  },
  async headers() {
    return [
      {
        source: '/embed/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/((?!embed).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
module.exports = nextConfig;