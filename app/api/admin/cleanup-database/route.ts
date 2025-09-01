import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting database cleanup...')
    
    const cleanupQueries = [
      // 1. 删除作业相关表格
      'DROP TABLE IF EXISTS submissions CASCADE',
      'DROP TABLE IF EXISTS assignments CASCADE',
      
      // 2. 删除毕业相关表格
      'DROP TABLE IF EXISTS student_graduation_status CASCADE',
      'DROP TABLE IF EXISTS graduation_requirements CASCADE',
      
      // 3. 删除内容生成相关表格
      'DROP TABLE IF EXISTS generated_content CASCADE',
      
      // 4. 删除热门帖子相关表格
      'DROP VIEW IF EXISTS student_best_posts CASCADE',
      'DROP TABLE IF EXISTS hot_posts CASCADE',
      
      // 5. 删除打卡卡片表格
      'DROP TABLE IF EXISTS punch_cards CASCADE',
      
      // 6. 删除学员帖子统计表格
      'DROP TABLE IF EXISTS student_post_stats CASCADE',
      'DROP TABLE IF EXISTS student_posts CASCADE',
      
      // 7. 删除用户画像表格
      'DROP TABLE IF EXISTS user_personas CASCADE',
      
      // 8. 删除重复的打卡表格
      'DROP TABLE IF EXISTS xhs_checkins CASCADE',
      
      // 9. 删除打卡计划表格
      'DROP TABLE IF EXISTS checkin_plans CASCADE'
    ]
    
    const results = []
    let successCount = 0
    let errorCount = 0
    
    for (const query of cleanupQueries) {
      try {
        console.log(`执行: ${query}`)
        const { error } = await supabase.rpc('execute_sql', { sql_query: query })
        
        if (error) {
          console.error(`❌ 执行失败: ${query}`, error)
          results.push({
            query,
            success: false,
            error: error.message
          })
          errorCount++
        } else {
          console.log(`✅ 执行成功: ${query}`)
          results.push({
            query,
            success: true
          })
          successCount++
        }
      } catch (err) {
        console.error(`❌ 执行异常: ${query}`, err)
        results.push({
          query,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
        errorCount++
      }
    }
    
    // 获取剩余的表格列表
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
    
    const remainingTables = tables?.map(t => t.table_name) || []
    
    console.log('🧹 Database cleanup completed!')
    console.log(`✅ 成功: ${successCount}, ❌ 失败: ${errorCount}`)
    console.log('剩余表格:', remainingTables)
    
    return NextResponse.json({
      success: true,
      message: `数据库清理完成！成功: ${successCount}, 失败: ${errorCount}`,
      results,
      statistics: {
        totalQueries: cleanupQueries.length,
        successCount,
        errorCount
      },
      remainingTables
    })
    
  } catch (error) {
    console.error('🚨 Database cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
