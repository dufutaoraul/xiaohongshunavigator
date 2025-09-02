import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, action } = body

    // 验证管理员权限
    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing student_id' },
        { status: 400 }
      )
    }

    // 检查用户是否为管理员
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('student_id', student_id)
      .single()

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    let result = { success: true, message: '', details: {} }

    switch (action) {
      case 'cleanup_old_checkins':
        // 清理30天前的打卡记录
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0]

        const { data: deletedCheckins, error: checkinError } = await supabase
          .from('xhs_checkins')
          .delete()
          .lt('date', cutoffDate)
          .select()

        if (checkinError) {
          throw new Error(`清理打卡记录失败: ${checkinError.message}`)
        }

        result.message = `成功清理了 ${deletedCheckins?.length || 0} 条30天前的打卡记录`
        result.details = { deleted_checkins: deletedCheckins?.length || 0 }
        break

      case 'cleanup_old_notes':
        // 清理7天前未更新的笔记缓存
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const notesCutoffDate = sevenDaysAgo.toISOString()

        const { data: deletedNotes, error: notesError } = await supabase
          .from('xhs_notes_cache')
          .delete()
          .lt('last_seen_at', notesCutoffDate)
          .select()

        if (notesError) {
          throw new Error(`清理笔记缓存失败: ${notesError.message}`)
        }

        result.message = `成功清理了 ${deletedNotes?.length || 0} 条7天前的笔记缓存`
        result.details = { deleted_notes: deletedNotes?.length || 0 }
        break

      case 'cleanup_old_alerts':
        // 清理已读的提醒（超过3天）
        const alertsCutoffDate = new Date()
        alertsCutoffDate.setDate(alertsCutoffDate.getDate() - 3)

        const { data: deletedAlerts, error: alertsError } = await supabase
          .from('xhs_alerts')
          .delete()
          .eq('is_read', true)
          .lt('created_at', alertsCutoffDate.toISOString())
          .select()

        if (alertsError) {
          throw new Error(`清理提醒记录失败: ${alertsError.message}`)
        }

        result.message = `成功清理了 ${deletedAlerts?.length || 0} 条已读提醒记录`
        result.details = { deleted_alerts: deletedAlerts?.length || 0 }
        break

      case 'cleanup_all':
        // 执行所有清理操作
        const results = []
        
        // 清理打卡记录
        const thirtyDaysAgoAll = new Date()
        thirtyDaysAgoAll.setDate(thirtyDaysAgoAll.getDate() - 30)
        const { data: allDeletedCheckins } = await supabase
          .from('xhs_checkins')
          .delete()
          .lt('date', thirtyDaysAgoAll.toISOString().split('T')[0])
          .select()
        results.push(`打卡记录: ${allDeletedCheckins?.length || 0}`)

        // 清理笔记缓存
        const sevenDaysAgoAll = new Date()
        sevenDaysAgoAll.setDate(sevenDaysAgoAll.getDate() - 7)
        const { data: allDeletedNotes } = await supabase
          .from('xhs_notes_cache')
          .delete()
          .lt('last_seen_at', sevenDaysAgoAll.toISOString())
          .select()
        results.push(`笔记缓存: ${allDeletedNotes?.length || 0}`)

        // 清理提醒记录
        const alertsCutoffAll = new Date()
        alertsCutoffAll.setDate(alertsCutoffAll.getDate() - 3)
        const { data: allDeletedAlerts } = await supabase
          .from('xhs_alerts')
          .delete()
          .eq('is_read', true)
          .lt('created_at', alertsCutoffAll.toISOString())
          .select()
        results.push(`提醒记录: ${allDeletedAlerts?.length || 0}`)

        result.message = `全面清理完成，清理项目: ${results.join(', ')}`
        result.details = {
          deleted_checkins: allDeletedCheckins?.length || 0,
          deleted_notes: allDeletedNotes?.length || 0,
          deleted_alerts: allDeletedAlerts?.length || 0
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    console.log(`🧹 [Admin] ${student_id} 执行数据库清理: ${action} - ${result.message}`)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Database cleanup error:', error)
    return NextResponse.json(
      { error: 'Database cleanup failed', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}