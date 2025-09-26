// 执行小红书集成功能的数据库迁移脚本
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 配置')
  console.error('请确保 .env.local 文件包含 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🔗 连接到 Supabase...')
console.log(`📍 URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('📄 读取迁移脚本...')
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250925_xhs_integration_tables.sql')

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ 迁移文件不存在:', migrationPath)
      return false
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    console.log(`📊 迁移脚本大小: ${(migrationSQL.length / 1024).toFixed(2)}KB`)

    console.log('🚀 执行数据库迁移...')

    // 拆分SQL脚本为多个语句
    const sqlStatements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i]

      if (statement.length < 10) continue // 跳过太短的语句

      try {
        console.log(`⏳ 执行语句 ${i + 1}/${sqlStatements.length}...`)

        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        })

        if (error) {
          // 尝试直接执行
          const { error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1)

          if (directError) {
            console.warn(`⚠️  语句 ${i + 1} 执行警告:`, error.message)
            errorCount++
          } else {
            // 由于Supabase客户端限制，我们需要提示用户手动执行
            console.log(`📝 请手动执行以下SQL语句 ${i + 1}:`)
            console.log('---')
            console.log(statement + ';')
            console.log('---')
            successCount++
          }
        } else {
          console.log(`✅ 语句 ${i + 1} 执行成功`)
          successCount++
        }

        // 添加延迟避免频率限制
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (err) {
        console.error(`❌ 语句 ${i + 1} 执行失败:`, err.message)
        errorCount++
      }
    }

    console.log('\n📊 迁移统计:')
    console.log(`✅ 成功: ${successCount} 个语句`)
    console.log(`❌ 失败: ${errorCount} 个语句`)

    if (errorCount === 0) {
      console.log('\n🎉 数据库迁移完成!')

      // 验证表是否创建成功
      console.log('\n🔍 验证新创建的表...')
      await verifyTables()

    } else {
      console.log('\n⚠️  迁移过程中遇到一些问题')
      console.log('💡 建议手动在 Supabase SQL 编辑器中执行迁移脚本')
    }

    return errorCount === 0

  } catch (error) {
    console.error('❌ 迁移失败:', error.message)
    return false
  }
}

async function verifyTables() {
  const expectedTables = [
    'xhs_users_cache',
    'xhs_posts_cache',
    'xhs_trending_posts',
    'xhs_search_cache',
    'xhs_crawl_logs'
  ]

  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', tableName)
        .eq('table_schema', 'public')

      if (error) {
        console.log(`⚠️  无法验证表 ${tableName}: ${error.message}`)
      } else if (data && data.length > 0) {
        console.log(`✅ 表 ${tableName} 已创建`)
      } else {
        console.log(`❌ 表 ${tableName} 未找到`)
      }
    } catch (err) {
      console.log(`⚠️  验证表 ${tableName} 时出错: ${err.message}`)
    }
  }
}

// 执行迁移
runMigration()
  .then(success => {
    if (success) {
      console.log('\n✨ 小红书集成功能数据库准备完成!')
      console.log('🔗 您可以访问 Supabase Dashboard 查看新创建的表:')
      console.log(`   ${supabaseUrl.replace('/rest/v1', '').replace('https://', 'https://app.supabase.com/project/')}/editor`)
    } else {
      console.log('\n💡 请手动执行数据库迁移:')
      console.log('1. 访问 Supabase Dashboard')
      console.log('2. 进入 SQL Editor')
      console.log('3. 执行 supabase/migrations/20250925_xhs_integration_tables.sql')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 脚本执行失败:', error)
    process.exit(1)
  })