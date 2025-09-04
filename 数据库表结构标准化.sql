-- ===================================
-- 🧹 数据库表结构标准化脚本
-- ===================================
-- 目标：清理混乱的表结构，建立标准化的数据库架构

-- =====================================================
-- 🔍 第1步：检查当前表结构
-- =====================================================

-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 查看 checkin_records 表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
ORDER BY ordinal_position;

-- =====================================================
-- 🗑️ 第2步：删除不必要的表
-- =====================================================

-- 删除重复或不使用的表
DROP TABLE IF EXISTS student_checkins CASCADE;
DROP TABLE IF EXISTS xhs_checkins CASCADE;
DROP TABLE IF EXISTS checkin_plans CASCADE;
DROP TABLE IF EXISTS punch_cards CASCADE;

-- =====================================================
-- 🏗️ 第3步：标准化 checkin_records 表
-- =====================================================

-- 如果表不存在，创建标准表
CREATE TABLE IF NOT EXISTS checkin_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    checkin_date DATE NOT NULL,
    xhs_url TEXT NOT NULL, -- 统一使用这个字段名
    status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'invalid', 'pending')),
    admin_review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, checkin_date)
);

-- 删除重复字段（如果存在）
ALTER TABLE checkin_records DROP COLUMN IF EXISTS xiaohongshu_url;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS student_name;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS content_title;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS content_description;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS plan_id;
ALTER TABLE checkin_records DROP COLUMN IF EXISTS post_publish_time;

-- 确保必要字段存在
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS xhs_url TEXT;
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'valid';
ALTER TABLE checkin_records ADD COLUMN IF NOT EXISTS admin_review_notes TEXT;

-- 添加约束
ALTER TABLE checkin_records DROP CONSTRAINT IF EXISTS checkin_records_status_check;
ALTER TABLE checkin_records ADD CONSTRAINT checkin_records_status_check 
    CHECK (status IN ('valid', 'invalid', 'pending'));

-- =====================================================
-- 🏗️ 第4步：标准化 checkin_schedules 表
-- =====================================================

CREATE TABLE IF NOT EXISTS checkin_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    schedule_type TEXT DEFAULT 'admin_set' CHECK (schedule_type IN ('admin_set', 'self_set')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, start_date)
);

-- =====================================================
-- 🔗 第5步：添加外键约束
-- =====================================================

-- 删除现有外键约束
ALTER TABLE checkin_records DROP CONSTRAINT IF EXISTS checkin_records_student_id_fkey;
ALTER TABLE checkin_schedules DROP CONSTRAINT IF EXISTS checkin_schedules_student_id_fkey;

-- 添加级联删除的外键约束
ALTER TABLE checkin_records 
ADD CONSTRAINT checkin_records_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE;

ALTER TABLE checkin_schedules 
ADD CONSTRAINT checkin_schedules_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE;

-- =====================================================
-- 📊 第6步：创建索引优化查询
-- =====================================================

-- 为常用查询创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_records_student_date 
ON checkin_records(student_id, checkin_date);

CREATE INDEX IF NOT EXISTS idx_checkin_records_status 
ON checkin_records(status);

CREATE INDEX IF NOT EXISTS idx_checkin_schedules_student_active 
ON checkin_schedules(student_id, is_active);

-- =====================================================
-- 📝 第7步：添加表注释
-- =====================================================

COMMENT ON TABLE checkin_records IS '学员打卡记录表 - 存储每日小红书链接提交';
COMMENT ON TABLE checkin_schedules IS '打卡时间安排表 - 管理员或学员设置的打卡周期';

COMMENT ON COLUMN checkin_records.student_id IS '学员学号';
COMMENT ON COLUMN checkin_records.checkin_date IS '打卡日期';
COMMENT ON COLUMN checkin_records.xhs_url IS '小红书链接';
COMMENT ON COLUMN checkin_records.status IS '审核状态: valid-有效, invalid-无效, pending-待审核';

COMMENT ON COLUMN checkin_schedules.schedule_type IS '设置类型: admin_set-管理员设置, self_set-学员自主设置';

-- =====================================================
-- ✅ 第8步：验证表结构
-- =====================================================

-- 验证最终表结构
SELECT '=== checkin_records 表结构 ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
ORDER BY ordinal_position;

SELECT '=== checkin_schedules 表结构 ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'checkin_schedules' 
ORDER BY ordinal_position;

-- 验证外键约束
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('checkin_records', 'checkin_schedules');

-- =====================================================
-- 🧪 第9步：测试数据插入
-- =====================================================

-- 测试插入打卡记录（如果有测试用户）
-- INSERT INTO checkin_records (student_id, checkin_date, xhs_url, status)
-- VALUES ('TEST_STUDENT', CURRENT_DATE, 'https://www.xiaohongshu.com/test', 'valid')
-- ON CONFLICT (student_id, checkin_date) DO NOTHING;
