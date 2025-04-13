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
  },
  // Remove the transpilePackages line since it conflicts
  webpack: (config, { isServer }) => {
    if (!isServer) {
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