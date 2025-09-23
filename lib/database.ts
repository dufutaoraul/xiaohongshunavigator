import { supabase } from './supabase'

// 学员信息接口
export interface StudentInfo {
  id?: string
  student_id: string
  name: string
  real_name?: string  // 真实姓名，用于生成证书
  persona?: string
  keywords?: string
  vision?: string
  created_at?: string
}

// 根据学号查询学员信息
export async function getStudentByStudentId(studentId: string): Promise<StudentInfo | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 没找到记录
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching student:', error)
    return null
  }
}

// 创建或更新学员信息
export async function upsertStudent(studentData: StudentInfo): Promise<boolean> {
  try {
    console.log('🔄 开始保存学员数据:', studentData)

    // 检查Supabase客户端配置
    console.log('🔗 Supabase配置检查:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      client: !!supabase
    })

    const updateData = {
      student_id: studentData.student_id,
      name: studentData.name,
      real_name: studentData.real_name,
      persona: studentData.persona,
      keywords: studentData.keywords,
      vision: studentData.vision
    }

    console.log('💾 准备upsert的数据:', updateData)

    const { data, error } = await supabase
      .from('users')
      .upsert(updateData, {
        onConflict: 'student_id'
      })
      .select()

    if (error) {
      console.error('❌ Supabase upsert 错误详情:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      })
      throw error
    }

    console.log('✅ 学员数据保存成功:', data)
    return true
  } catch (error) {
    console.error('🚨 upsertStudent函数错误:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      studentData
    })
    return false
  }
}

// 搜索学员（用于自动补全）
export async function searchStudents(query: string): Promise<StudentInfo[]> {
  if (!query.trim() || query.length < 3) return []
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('student_id, name, persona, keywords, vision')
      .or(`student_id.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(10)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching students:', error)
    return []
  }
}