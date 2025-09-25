#!/usr/bin/env node

/**
 * 🚀 检查 Vercel 部署状态
 */

const https = require('https');

console.log('🔍 检查 Vercel 部署状态...');

// 你的 Vercel 项目 URL
const VERCEL_URL = 'https://xiaohongshunavigator.vercel.app';

function checkDeployment() {
  return new Promise((resolve, reject) => {
    const req = https.get(VERCEL_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          bodyLength: data.length,
          hasContent: data.length > 0
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

async function main() {
  try {
    console.log(`📡 正在检查: ${VERCEL_URL}`);
    
    const result = await checkDeployment();
    
    console.log('\n📊 部署状态:');
    console.log(`   状态码: ${result.statusCode}`);
    console.log(`   响应大小: ${result.bodyLength} bytes`);
    console.log(`   有内容: ${result.hasContent ? '✅' : '❌'}`);
    
    if (result.headers['x-vercel-id']) {
      console.log(`   Vercel ID: ${result.headers['x-vercel-id']}`);
    }
    
    if (result.headers['x-vercel-cache']) {
      console.log(`   缓存状态: ${result.headers['x-vercel-cache']}`);
    }
    
    if (result.statusCode === 200) {
      console.log('\n🎉 部署成功！网站正常运行');
    } else {
      console.log(`\n⚠️  状态码异常: ${result.statusCode}`);
    }
    
  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('   1. 部署还在进行中');
    console.log('   2. 网络连接问题');
    console.log('   3. Vercel 服务异常');
  }
}

main();
