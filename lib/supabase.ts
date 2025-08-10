import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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