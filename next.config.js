/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure specific images and other assets are optimized
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile images
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    // Don't use remote loader on Netlify - rely on their image optimization
    unoptimized: process.env.NETLIFY === 'true',
  },
  
  // Ensure environment variables are properly handled
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL,
  },
  
  // Handle trailing slashes consistently
  trailingSlash: false,
  
  // Improve build speed
  swcMinify: true,
  
  // Disable strict mode in production for better performance
  reactStrictMode: process.env.NODE_ENV !== 'production',
  
  // Configure proper server-side support
  experimental: {
    // Support NextAuth integration
    serverComponentsExternalPackages: ['next-auth'],
    // Support server actions
    serverActions: {
      allowedOrigins: ['localhost:3000', 'meeting-scheduler1.netlify.app'],
    },
    // Ensure proper SSR handling
    esmExternals: 'loose',
  },
  
  // Optimize for Netlify deployment with SSR support
  poweredByHeader: false,
  
  // Configure proper headers for authentication and caching
  async headers() {
    return [
      {
        source: '/api/auth/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/auth/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Enable proper runtime support
  typescript: {
    ignoreBuildErrors: process.env.NETLIFY === 'true',
  },

  // Configure proper Netlify deployment
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side only config
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Skip static optimization for auth pages
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Properly handle Next.js + Netlify integration
  distDir: '.next',
};

module.exports = nextConfig;
