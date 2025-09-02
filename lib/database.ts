import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 学员信息接口
export interface StudentInfo {
  id?: string
  student_id: string
  name: string
  real_name?: string  // 真实姓名，用于生成证书
  persona?: string
  keywords?: string
  vision?: string
  xiaohongshu_profile_url?: string  // 小红书主页链接
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
    console.log('Upserting student data:', studentData)
    const { error } = await supabase
      .from('users')
      .upsert({
        student_id: studentData.student_id,
        name: studentData.name,
        real_name: studentData.real_name,
        persona: studentData.persona,
        keywords: studentData.keywords,
        vision: studentData.vision
      }, {
        onConflict: 'student_id'
      })

    if (error) {
      console.error('Supabase upsert error:', error)
      throw error
    }
    console.log('Student data upserted successfully')
    return true
  } catch (error) {
    console.error('Error upserting student:', error)
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