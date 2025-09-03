#!/usr/bin/env node

/**
 * 部署检查脚本
 * 用于检查Netlify部署中的常见问题
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 从.env.local读取的配置
  envFile: path.join(process.cwd(), '.env.local'),
  // 需要检查的环境变量
  requiredEnvVars: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
};

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 读取环境变量文件
function readEnvFile() {
  try {
    if (!fs.existsSync(CONFIG.envFile)) {
      log('❌ .env.local 文件不存在', 'red');
      return {};
    }

    const content = fs.readFileSync(CONFIG.envFile, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    log(`❌ 读取 .env.local 失败: ${error.message}`, 'red');
    return {};
  }
}

// 检查环境变量
function checkEnvironmentVariables(env) {
  log('\n🔍 检查环境变量...', 'blue');
  
  let allValid = true;
  
  CONFIG.requiredEnvVars.forEach(varName => {
    const value = env[varName];
    if (!value) {
      log(`❌ 缺少环境变量: ${varName}`, 'red');
      allValid = false;
    } else if (value.includes('placeholder')) {
      log(`❌ 环境变量使用占位符: ${varName}`, 'red');
      allValid = false;
    } else {
      log(`✅ ${varName}: 已配置`, 'green');
    }
  });

  return allValid;
}

// 测试Supabase连接
function testSupabaseConnection(env) {
  return new Promise((resolve) => {
    log('\n🔍 测试Supabase连接...', 'blue');
    
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      log('❌ Supabase配置不完整', 'red');
      resolve(false);
      return;
    }

    // 简单的健康检查
    const url = new URL('/rest/v1/', supabaseUrl);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        log('✅ Supabase连接正常', 'green');
        resolve(true);
      } else {
        log(`❌ Supabase连接失败: HTTP ${res.statusCode}`, 'red');
        resolve(false);
      }
    });

    req.on('error', (error) => {
      log(`❌ Supabase连接错误: ${error.message}`, 'red');
      resolve(false);
    });

    req.setTimeout(10000, () => {
      log('❌ Supabase连接超时', 'red');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 生成Netlify环境变量配置
function generateNetlifyConfig(env) {
  log('\n📋 Netlify环境变量配置:', 'blue');
  log('请在Netlify控制台的Environment Variables中添加以下配置:\n', 'yellow');
  
  CONFIG.requiredEnvVars.forEach(varName => {
    const value = env[varName];
    if (value && !value.includes('placeholder')) {
      log(`${varName}=${value}`, 'green');
    } else {
      log(`${varName}=<需要配置>`, 'red');
    }
  });
  
  log('\n其他可选环境变量:', 'yellow');
  Object.keys(env).forEach(key => {
    if (!CONFIG.requiredEnvVars.includes(key) && !env[key].includes('placeholder')) {
      log(`${key}=${env[key]}`, 'green');
    }
  });
}

// 主函数
async function main() {
  log('🚀 开始部署检查...', 'blue');
  
  // 读取环境变量
  const env = readEnvFile();
  
  // 检查环境变量
  const envValid = checkEnvironmentVariables(env);
  
  // 测试Supabase连接
  const supabaseValid = await testSupabaseConnection(env);
  
  // 生成配置
  generateNetlifyConfig(env);
  
  // 总结
  log('\n📊 检查结果:', 'blue');
  log(`环境变量: ${envValid ? '✅ 正常' : '❌ 有问题'}`, envValid ? 'green' : 'red');
  log(`Supabase连接: ${supabaseValid ? '✅ 正常' : '❌ 有问题'}`, supabaseValid ? 'green' : 'red');
  
  if (envValid && supabaseValid) {
    log('\n🎉 所有检查通过！可以部署到Netlify', 'green');
  } else {
    log('\n⚠️  发现问题，请修复后重新检查', 'yellow');
  }
}

// 运行检查
main().catch(error => {
  log(`❌ 检查过程中发生错误: ${error.message}`, 'red');
  process.exit(1);
});
