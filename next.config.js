/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    // We'll keep this one and remove transpilePackages
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },
  eslint: {
    ignoreDuringBuilds: true,
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
  
  webpack(config) {
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: 'asset/resource',
    });

    if (!config.isServer) {
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
    return config;
  },
}

module.exports = nextConfig