/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure image optimization settings
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile images
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  
  // Ensure environment variables are properly handled
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.VERCEL_URL,
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
      allowedOrigins: ['localhost:3000'],
    },
    // Ensure proper SSR handling
    esmExternals: 'loose',
  },
  
  // Disable the 'X-Powered-By' header for security
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

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Webpack configuration
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

  // Standard Next.js build directory
  distDir: '.next',
};

module.exports = nextConfig;
