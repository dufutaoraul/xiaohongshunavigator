-- 小红书导航器 - 完整数据库设计
-- 执行顺序：请按照注释中的顺序在Supabase SQL编辑器中执行

-- =====================================================
-- 第一步：创建用户表 (users)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  real_name TEXT, -- 真实姓名
  persona TEXT, -- 人设定位
  keywords TEXT, -- 关键词
  vision TEXT, -- 90天愿景
  notes TEXT, -- 备注
  password TEXT, -- 密码
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')), -- 角色
  xiaohongshu_profile_url TEXT -- 小红书个人主页链接
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 第二步：创建打卡时间安排表 (checkin_schedules)
-- =====================================================
CREATE TABLE IF NOT EXISTS checkin_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(student_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL, -- 创建者（管理员学号）
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(student_id, start_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_student_id ON checkin_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_dates ON checkin_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_checkin_schedules_active ON checkin_schedules(is_active);

-- =====================================================
-- 第三步：创建打卡记录表 (checkin_records)
-- =====================================================
CREATE TABLE IF NOT EXISTS checkin_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(student_id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  xiaohongshu_url TEXT NOT NULL, -- 小红书链接
  content_title TEXT, -- 内容标题（可选）
  content_description TEXT, -- 内容描述（可选）
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')), -- 审核状态
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, checkin_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_records_student_id ON checkin_records(student_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_date ON checkin_records(checkin_date);
CREATE INDEX IF NOT EXISTS idx_checkin_records_status ON checkin_records(status);

-- =====================================================
-- 第四步：创建触发器函数（自动更新时间戳）
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为checkin_records表创建触发器
DROP TRIGGER IF EXISTS update_checkin_records_updated_at ON checkin_records;
CREATE TRIGGER update_checkin_records_updated_at
    BEFORE UPDATE ON checkin_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 第五步：插入默认管理员账户
-- =====================================================
INSERT INTO users (student_id, name, real_name, role, password, persona, keywords, vision)
VALUES ('ADMIN001', '系统管理员', '管理员', 'admin', 'admin123', '系统管理员', '管理,系统,运营', '管理好整个系统')
ON CONFLICT (student_id) DO UPDATE SET
  name = EXCLUDED.name,
  real_name = EXCLUDED.real_name,
  role = EXCLUDED.role,
  password = EXCLUDED.password,
  persona = EXCLUDED.persona,
  keywords = EXCLUDED.keywords,
  vision = EXCLUDED.vision;

-- =====================================================
-- 第六步：创建RLS (Row Level Security) 策略
-- =====================================================

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_records ENABLE ROW LEVEL SECURITY;

-- users表策略
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (true);

-- checkin_schedules表策略
CREATE POLICY "Users can view their own schedules" ON checkin_schedules FOR SELECT USING (true);
CREATE POLICY "Admins can manage schedules" ON checkin_schedules FOR ALL USING (true);

-- checkin_records表策略
CREATE POLICY "Users can view their own records" ON checkin_records FOR SELECT USING (true);
CREATE POLICY "Users can manage their own records" ON checkin_records FOR ALL USING (true);

-- =====================================================
-- 第七步：添加注释
-- =====================================================
COMMENT ON TABLE users IS '用户表，包含学员和管理员信息';
COMMENT ON TABLE checkin_schedules IS '打卡时间安排表，管理员设置学员的打卡周期';
COMMENT ON TABLE checkin_records IS '打卡记录表，存储学员每日打卡的小红书链接';

COMMENT ON COLUMN users.student_id IS '学员学号，唯一标识';
COMMENT ON COLUMN users.real_name IS '真实姓名';
COMMENT ON COLUMN users.role IS '用户角色：student或admin';

COMMENT ON COLUMN checkin_schedules.start_date IS '打卡开始日期';
COMMENT ON COLUMN checkin_schedules.end_date IS '打卡结束日期（开始日期+93天）';
COMMENT ON COLUMN checkin_schedules.created_by IS '创建者（管理员学号）';

COMMENT ON COLUMN checkin_records.xiaohongshu_url IS '小红书作品链接';
COMMENT ON COLUMN checkin_records.status IS '审核状态：pending待审核，approved已通过，rejected未通过';
