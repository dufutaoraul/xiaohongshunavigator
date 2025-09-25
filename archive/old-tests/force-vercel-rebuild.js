#!/usr/bin/env node

/**
 * 🚀 强制 Vercel 重新构建脚本
 * 用于清空缓存并强制重新部署
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 开始强制 Vercel 重新构建...');

// 1. 更新时间戳文件
const timestamp = new Date().toISOString();
const buildId = Math.random().toString(36).substring(7);

const cacheConfig = {
  lastUpdate: timestamp,
  buildId: buildId,
  forceRebuild: true,
  reason: 'DATABASE_MIGRATION_COMPLETE'
};

// 2. 写入缓存配置
fs.writeFileSync(
  path.join(__dirname, '.vercel-cache-bust.json'),
  JSON.stringify(cacheConfig, null, 2)
);

// 3. 更新 next.config.js 中的构建ID
const nextConfigPath = path.join(__dirname, 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  // 添加或更新 generateBuildId
  if (!nextConfig.includes('generateBuildId')) {
    nextConfig = nextConfig.replace(
      'module.exports = nextConfig',
      `nextConfig.generateBuildId = async () => {
  return '${buildId}-${Date.now()}'
}

module.exports = nextConfig`
    );
  } else {
    nextConfig = nextConfig.replace(
      /generateBuildId.*?}/s,
      `generateBuildId: async () => {
    return '${buildId}-${Date.now()}'
  }`
    );
  }
  
  fs.writeFileSync(nextConfigPath, nextConfig);
}

console.log(`✅ 缓存清空完成！`);
console.log(`📦 构建ID: ${buildId}`);
console.log(`⏰ 时间戳: ${timestamp}`);
console.log(`🚀 现在可以推送到 Git 触发重新部署`);
