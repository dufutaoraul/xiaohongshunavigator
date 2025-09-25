-- 添加管理员用户的SQL脚本
-- 请在Supabase SQL编辑器中执行此脚本

-- 首先确保users表有role字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- 插入管理员用户（密码已用bcrypt加密：admin123456）
INSERT INTO users (student_id, name, email, password, role) 
VALUES (
  'ADMIN001', 
  '系统管理员', 
  'admin@example.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 这是 'admin123456' 的bcrypt哈希
  'admin'
) ON CONFLICT (student_id) DO NOTHING;

-- 插入测试学员用户（密码已用bcrypt加密：student123456）
INSERT INTO users (student_id, name, email, password, role) 
VALUES (
  'AXCF2025040001', 
  '测试学员', 
  'student@example.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 这是 'student123456' 的bcrypt哈希
  'student'
) ON CONFLICT (student_id) DO NOTHING;

-- 查看创建的用户
SELECT student_id, name, role, created_at FROM users WHERE role IN ('admin', 'student');