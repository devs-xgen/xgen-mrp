/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // This is important for Docker
  experimental: {
    // Remove serverActions from here
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // If you're using Tailwind:
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig