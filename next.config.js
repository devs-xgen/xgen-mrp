/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Next.js 15 - moved serverComponentsExternalPackages out of experimental
  serverExternalPackages: ['@prisma/client', '@prisma/extension-accelerate', 'bcryptjs'],
  
  experimental: {
    scrollRestoration: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  
  webpack(config, { dev, isServer }) {
    // Add rule to handle HTML files
    config.module.rules.push({
      test: /\.html$/,
      type: 'asset/resource',
    });
    
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: 'asset/resource',
    });



    if (!config.isServer) {
      // Add server-only packages to client-side externals
      config.externals = [...(config.externals || []), 'bcryptjs'];
      
      config.resolve.fallback = {
        fs: false,
        dns: false,
        net: false,
        tls: false,
        async_hooks: false,
        'fs/promises': false,
        child_process: false,
        crypto: false,
        stream: false,
        os: false,
        path: false,
        http: false,
        https: false,
        zlib: false,
        events: false,
        url: false,
        util: false,
        querystring: false,
      };
    }
    
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });


    
    return config;
  },
  
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    // Expose the app version to the client for diagnostics/UI
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
  },
  
  // Add redirects to handle plural form URLs
  async redirects() {
    return [
      {
        source: '/billing-statements/share/:token',
        destination: '/billing-statement/share/:token',
        permanent: true,
      },
      {
        source: '/sales-invoices/share/:token',
        destination: '/sales-invoice/share/:token',
        permanent: true,
      },
      {
        source: '/delivery-receipts/share/:token',
        destination: '/delivery-receipt/share/:token',
        permanent: true,
      },
    ]
  },
  // Add caching headers to ensure critical PWA files update promptly
  async headers() {
    const existing = [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
    const pwaHeaders = [
      {
        // Ensure the browser always re-fetches the service worker file
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Manifest changes should not be aggressively cached
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ];
    return [...existing, ...pwaHeaders];
  },
}

module.exports = nextConfig