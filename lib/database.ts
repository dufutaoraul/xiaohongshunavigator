import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 学员信息接口
export interface StudentInfo {
  id?: string
  student_id: string
  name: string
  persona?: string
  keywords?: string
  vision?: string
  created_at?: string
  updated_at?: string
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
    const { error } = await supabase
      .from('users')
      .upsert({
        student_id: studentData.student_id,
        name: studentData.name,
        persona: studentData.persona,
        keywords: studentData.keywords,
        vision: studentData.vision,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id'
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error upserting student:', error)
    return false
  }
}

// 创建示例数据
export const sampleStudents: StudentInfo[] = [
  {
    student_id: 'AXCF2025040088',
    name: '张三',
    persona: 'AI学习达人，专注于效率提升和工具分享',
    keywords: 'AI工具,效率提升,学习方法',
    vision: '成为AI领域的知名博主，帮助更多人掌握AI技能'
  },
  {
    student_id: 'AXCF2025040089',
    name: '李四',
    persona: 'AI创业者，分享AI商业化实践经验',
    keywords: 'AI创业,商业化,副业',
    vision: '建立自己的AI咨询公司，为企业提供AI解决方案'
  },
  {
    student_id: 'AXCF2025040090',
    name: '王五',
    persona: '职场AI应用专家，专注职场效率优化',
    keywords: '职场技能,工作效率,AI应用',
    vision: '成为公司的AI应用推广大使，提升团队整体效率'
  },
  {
    student_id: 'AXCF2025040091',
    name: '赵六',
    persona: 'AI内容创作者，专注小红书和短视频',
    keywords: '内容创作,小红书,短视频',
    vision: '打造百万粉丝的AI内容账号，实现内容变现'
  },
  {
    student_id: 'AXCF2025040092',
    name: '孙七',
    persona: 'AI教育工作者，专注AI知识普及',
    keywords: 'AI教育,知识分享,在线课程',
    vision: '开发系列AI课程，成为AI教育领域的知名讲师'
  }
]