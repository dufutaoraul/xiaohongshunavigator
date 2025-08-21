import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 在构建时检查环境变量
if (typeof window === 'undefined' && (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co')) {
  console.warn('Supabase URL not configured properly for build')
}

// 只有在有效的URL时才创建客户端
export const supabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

// 数据类型定义
export interface User {
  id: string
  student_id: string
  created_at: string
  persona: string
  keywords: string
  vision: string
}

export interface PunchCard {
  id: string
  user_id: string
  submitted_at: string
  post_url: string
  post_created_at: string
  likes: number
  comments: number
  collections: number
}