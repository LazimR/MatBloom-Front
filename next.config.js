/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [],
  },
  // Solução para problemas de readlink no Windows
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }
    return config
  },
  // Desabilitar otimizações que podem causar problemas no Windows
  swcMinify: false,
}

module.exports = nextConfig
