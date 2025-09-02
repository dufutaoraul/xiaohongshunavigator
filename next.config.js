/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable in Next.js 13+, no experimental flag needed

  // 🔧 强制禁用缓存 - 解决部署缓存问题
  generateEtags: false,

  // 🔧 确保环境变量在构建时可用
  env: {
    CACHE_BUST: Date.now().toString(),
    BUILD_TIME: new Date().toISOString(),
  },

  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        { key: "Pragma", value: "no-cache" },
        { key: "Expires", value: "0" },
        { key: "X-Cache-Bust", value: Date.now().toString() }
      ],
    },
  ],
}

module.exports = nextConfig