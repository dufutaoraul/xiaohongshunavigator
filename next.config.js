/** @type {import('next').NextConfig} */
const nextConfig = {
  // 确保CSS正确处理
  transpilePackages: [],
  // Webpack配置
  webpack: (config, { isServer }) => {
    return config;
  },
}

module.exports = nextConfig